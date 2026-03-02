const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'user.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace deleteUser with updateUser
const deleteUserRegex = /\/\*\*\r?\n \* Delete a user\r?\n \*\/\r?\nexport const deleteUser = async \([\s\S]*?\}\r?\n\};\r?\n/g;

const updateUserCode = `/**
 * Update a user
 */
export const updateUser = async (
    req: Request,
    res: Response<ApiResponse<UserRow>>,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { name, email, role, college_id } = req.body;

        if (!name || !email || !role) {
            throw new AppError("Name, email, and role are required", 400);
        }

        const validRoles = [
            "super_admin", "admin", "hr", "engineer", "cxo",
            "college_admin", "college_staff", "student", "college"
        ];
        if (!validRoles.includes(role)) {
            throw new AppError("Invalid role specified", 400);
        }

        const isCollegeRole = ["college_admin", "college_staff", "college", "student"].includes(role);
        const finalCollegeId = isCollegeRole && college_id ? college_id : null;

        const existing = await queryOne<UserRow>("SELECT id FROM users WHERE email = $1 AND id != $2", [email, id]);
        if (existing) {
            throw new AppError("Email already in use", 409);
        }

        const updatedUser = await queryOne<UserRow>(
            \`UPDATE users SET name = $1, email = $2, role = $3::user_role, college_id = $4, updated_at = NOW() WHERE id = $5 RETURNING id, name, email, role, is_active, status, login_type\`,
            [name, email, role, finalCollegeId, id]
        );

        if (!updatedUser) {
            throw new AppError("User not found", 404);
        }

        res.json({ success: true, data: updatedUser, message: "User updated successfully" });
    } catch (err) {
        next(err);
    }
};
`;

content = content.replace(deleteUserRegex, updateUserCode);

// Modify createUser to support college_id
const createUserRegex = /const { name, email, password, role, login_type } = req\.body;/g;
const replaceCreateArgs = `const { name, email, password, role, login_type, college_id } = req.body;`;
content = content.replace(createUserRegex, replaceCreateArgs);

const insertRegex = /const user = await queryOne<UserRow>\([\s\S]*?RETURNING id, name, email, role, is_active, status, login_type, created_at\`,\s*\[name, email, hashedPassword, role, loginTypeVal\]\s*\);/;

const replaceInsertUser = `
        const isCollegeRole = ["college_admin", "college_staff", "college", "student"].includes(role);
        const finalCollegeId = isCollegeRole && college_id ? college_id : null;

        const user = await queryOne<UserRow>(
            \`INSERT INTO users (name, email, password, role, is_active, status, login_type, college_id)
             VALUES ($1, $2, $3, $4::user_role, TRUE, 'Active', $5, $6)
             RETURNING id, name, email, role, is_active, status, login_type, college_id, created_at\`,
            [name, email, hashedPassword, role, loginTypeVal, finalCollegeId]
        );`;

content = content.replace(insertRegex, replaceInsertUser);

fs.writeFileSync(filePath, content);
console.log('Patch successful');
