# Phase 1 Comprehensive Test Plan - Positive & Edge Cases

## 1. Add College Form (`/app/superadmin/colleges/new`)

### Positive Cases ✅

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Valid full form submission | All fields filled correctly | College created, redirects to list with success toast |
| 2 | Minimal valid submission | Only required fields | College created successfully |
| 3 | Large student limit | studentLimit = 10000 | Accepted and saved |
| 4 | Indian phone number | +91 9876543210 | Accepted |
| 5 | International email domain | admin@college.co.uk | Accepted |
| 6 | Long college name | 100+ character name | Accepted |
| 7 | Special characters in address | "123/A, #45, St. Mark's Road" | Accepted |
| 8 | Multiline address input | Address with line breaks | Formatted correctly |

### Edge Cases ⚠️

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Empty college name | "" | Error: "College name is required" |
| 2 | Only spaces in name | "   " | Error: "College name is required" |
| 3 | Invalid email format | "notanemail" | Error: "Invalid college email" |
| 4 | Invalid TPO email | "tpo@" | Error: "Invalid TPO email" |
| 5 | Missing required city | city = "" | Error: "City is required" |
| 6 | Missing required state | state = "" | Error: "State is required" |
| 7 | Student limit too low | studentLimit = 5 | Error: "Minimum 10 students" |
| 8 | Student limit zero | studentLimit = 0 | Error: "Must be > 0" |
| 9 | Student limit negative | studentLimit = -100 | Error: "Invalid number" |
| 10 | Duplicate email (if exists) | Same email as existing college | Error: "Email already registered" |
| 11 | Very long phone number | 50 digit phone | Truncated or error |
| 12 | Invalid characters in phone | "phone-+91" | Sanitized or error |
| 13 | Special characters in name | "College™ Ltd." | Accepted or sanitized |
| 14 | SQL injection attempt | `'; DROP TABLE colleges; --` | Escaped safely |
| 15 | XSS attempt in name | `<script>alert('xss')</script>` | Escaped/sanitized |

### Boundary Cases 🔲

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Maximum form timeout | Submit after 5 mins idle | Session expired error |
| 2 | Form resubmit (double click) | User clicks submit twice | Only one college created, duplicate prevented |
| 3 | Network error during submit | API timeout | Error toast, form data preserved |
| 4 | Partial form filled | 50% fields filled, click submit | Error listing missing fields |
| 5 | Very large form data | Max character inputs | All accepted and saved |

---

## 2. All Questions (`/app/superadmin/question-bank`)

### Positive Cases ✅

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Load all questions | No filters | 3+ questions displayed with all columns |
| 2 | Search by question text | Search "binary search" | Questions containing "binary search" shown |
| 3 | Search by topic | Search "Speed & Distance" | 2 questions from that topic shown |
| 4 | Search by company | Search "Google" | Google questions filtered |
| 5 | Filter by category | Category = Aptitude | Only aptitude questions shown |
| 6 | Filter by difficulty | Difficulty = Hard | Only hard questions shown |
| 7 | Combined search + filters | Search "speed" + Aptitude + Medium | Filtered correctly by all criteria |
| 8 | View success rate bar | Question with 78.5% success rate | Progress bar shows correct percentage |
| 9 | View usage count | Question used 45 times | Usage count shows 45 |
| 10 | Pagination (page 2) | Load page 2 with 50 per page | Next 50 questions shown |

### Edge Cases ⚠️

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Search with no results | Search "nonexistent" | "No questions found" message |
| 2 | Empty search field | "" | All questions shown (reset filter) |
| 3 | Case-insensitive search | "BINARY SEARCH" | Found (case ignored) |
| 4 | Partial word search | "bin" | Found "binary" |
| 5 | Special characters in search | "C++" or "C#" | Properly escaped and found |
| 6 | Very long search string | 1000 character search | Handled gracefully |
| 7 | Search with SQL injection | `'; DROP TABLE;--` | Escaped, no harm |
| 8 | XSS in search field | `<img src=x onerror=alert(1)>` | Escaped/sanitized |
| 9 | Unicode search | "café" or "Ñoño" | Found correctly |
| 10 | All filters None/All | Set all to "all" | Shows all questions |
| 11 | No questions in category | Filter for empty category | "No questions found" |
| 12 | Success rate = 0% | Question with 0% success | Progress bar empty |
| 13 | Success rate = 100% | Question with 100% success | Progress bar full |
| 14 | Usage count = 0 | Never-used question | Shows 0 usage |
| 15 | Very large usage count | 10000+ uses | Displayed correctly |

### Performance Cases 📊

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | 1000 questions loaded | Load table with 1000+ items | Pagination works, <1s per page |
| 2 | Real-time filter | Type in search box | Results update instantly (<200ms) |
| 3 | Filter switch (cat → diff) | Change category then difficulty | Stacks correctly |
| 4 | Clear all filters | Reset to no filters | All questions reappear quickly |
| 5 | Large result set (500 items) | Search returns 500 items | Table renders efficiently |

---

## 3. Categories & Topics (`/app/superadmin/question-bank/categories`)

### Positive Cases ✅

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | View all 3 categories | Load page | 3 categories displayed |
| 2 | See category description | Aptitude category | Description "Quantitative aptitude..." shown |
| 3 | See question count | Aptitude category | Shows "340 questions" |
| 4 | View topics in category | Aptitude expanded | Shows 4 topics with counts |
| 5 | Create new category | Name: "Soft Skills", Desc: "..." | Category added, appears in list |
| 6 | Add category with description | Full form | Category created with description |
| 7 | Delete category (no confirm) | Click delete icon | Category removed, toast shown |
| 8 | Delete topic in category | Click delete on topic | Topic removed from category |

### Edge Cases ⚠️

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Create without name | Name: "" | Error: "Category name required" |
| 2 | Create with spaces only | Name: "   " | Error: "Category name required" |
| 3 | Create duplicate name | Name: "Aptitude" (existing) | Error: "Category already exists" |
| 4 | Very long category name | 500 character name | Accepted or truncated |
| 5 | Special characters in name | "C++ & Python" | Accepted or sanitized |
| 6 | Delete non-empty category | Delete Aptitude (340 Qs) | Confirm: "Delete 340 associated questions?" |
| 7 | Delete and confirm | User confirms category delete | All associated questions deleted |
| 8 | Cancel delete operation | Click cancel on confirm | Category preserved |
| 9 | Delete already-deleted item | Double-click delete | Only delete once, error on retry |
| 10 | SQL injection in category name | Name: `'; DROP TABLE;--` | Escaped safely |
| 11 | XSS in description | Desc: `<script>alert()</script>` | Escaped/sanitized |

### Boundary Cases 🔲

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | No topics in category | New empty category | Shows "No topics" |
| 2 | 100+ topics in category | Create category with many topics | Scrollable/paginated topics |
| 3 | Very long topic name | 200 char topic name | Accepted, truncated with ellipsis |
| 4 | Category with 0 questions | Create and assign no questions | Shows "0 questions" |
| 5 | Form stays open (no close) | After create, form still visible | User can create another immediately |

---

## 4. Review Queue (`/app/superadmin/question-bank/review-queue`)

### Positive Cases ✅

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | View pending questions | Load page | 2 pending questions shown in list |
| 2 | Select first question | Click "What is the time complexity..." | Details shown in right panel |
| 3 | View question options | Click question | Shows A, B, C, D with correct answer highlighted |
| 4 | View explanation | Full question details | Explanation "Merge sort always divides..." shown |
| 5 | View quality score | Question details | Score "92%" displayed |
| 6 | Approve question | Click "Approve" button | Green button pressed, toast shows "Approved" |
| 7 | Reject with reason | Fill reason, click reject | Toast shows "Rejected", question removed from queue |
| 8 | See approval stats | After actions | Pending: 0, Approved: 1, Rejected: 1 (updated) |
| 9 | Navigate between questions | Click another question | Details change, form clears |
| 10 | Approve multiple | Approve 5 questions | All moved to approved list |

### Edge Cases ⚠️

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | No pending questions | Empty review queue | "No pending questions" message |
| 2 | Reject without reason | Leave reason empty, click reject | Error: "Reason required" |
| 3 | Reject with empty reason | Reason: "   " (spaces) | Error: "Reason required" |
| 4 | Very long rejection reason | 5000 character reason | Accepted and saved |
| 5 | Special characters in reason | Reason: "Option B has math: 2+2=4; wrong" | Accepted |
| 6 | XSS in rejection reason | Reason: `<script>alert()</script>` | Escaped/sanitized |
| 7 | Approve already approved | Try to approve twice | Error: "Already approved" |
| 8 | Reject already rejected | Try to reject twice | Error: "Already rejected" |
| 9 | No correct answer marked | MCQ with no correct answer | Warning shown, can still approve/reject |
| 10 | Missing options | Question without options shown | Error or skip gracefully |
| 11 | Quality score edge values | Score = 0%, Score = 100% | Both displayed correctly |
| 12 | Very old question | Generated 30 days ago | Still shows with old date |
| 13 | Concurrent approvals | User1 approves while User2 viewing | Conflict handled, not double-approved |

### Performance Cases 📊

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | 100 pending questions | Load queue with 100 questions | Pagination/virtualization works |
| 2 | Large question text | 10000 character question | Displays with text wrapping |
| 3 | Many options | MCQ with 10 options | All displayed and selectable |
| 4 | Load question details | Switch questions rapidly | Smooth transition, no lag |

---

## 5. Notifications (`/app/superadmin/notifications`)

### Positive Cases ✅

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | View announcements tab | Load page | Shows 2 announcements |
| 2 | View email templates tab | Click templates tab | Shows 2 email templates |
| 3 | Create announcement | Title & message filled | Announcement added, appears in list |
| 4 | Different announcement types | Create Info, Warning, Success, Error | All 4 types show with correct colors |
| 5 | Delete announcement | Click delete icon | Announcement removed, toast shown |
| 6 | View template variables | Click template | Shows {student_name}, {login_url} |
| 7 | Switch tabs | Announcements → Templates → Announcements | Data persists, tab remembers position |
| 8 | Active badge | Active announcement | Green "Active" badge shown |
| 9 | Creation date | Announcement created today | Shows "Created: 2026-07-04" |

### Edge Cases ⚠️

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Create without title | Title: "" | Error: "Title required" |
| 2 | Create without message | Message: "" | Error: "Message required" |
| 3 | Very long title | 500 character title | Accepted, truncated with ellipsis in list |
| 4 | Very long message | 10000 character message | Accepted, scrollable in view |
| 5 | HTML in message | Message: `<b>Bold</b>` | Escaped or rendered as text |
| 6 | XSS attempt | Title: `<img src=x onerror=alert()>` | Escaped/sanitized |
| 7 | Delete non-existent | Try to delete removed announcement | Error or 404 |
| 8 | Concurrent deletes | Delete same announcement twice | Only deletes once |
| 9 | Form resubmit | Create announcement, accidentally submit twice | Only one created |
| 10 | Invalid template variables | Variable: {nonexistent_var} | Shown as-is or with warning |
| 11 | Very large template body | 50000 character email body | Accepted and displayable |
| 12 | Special characters in template | Body: "Price: $100.50, expires 2026-07-31" | All preserved correctly |

### Boundary Cases 🔲

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | No announcements | Empty list | "No announcements" message |
| 2 | No templates | Empty list | "No templates" message |
| 3 | 1000+ announcements | Massive list | Pagination works |
| 4 | Template with 20+ variables | Many variables | All listed, scrollable |
| 5 | Form stays open after create | No auto-close | User can create another |

---

## Testing Tools & Environment

### Manual Testing Checklist
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Mobile (375px viewport)
- [ ] Tablet (768px viewport)
- [ ] Desktop (1920px viewport)

### API Testing (Postman/Curl)
- [ ] Test all endpoints with valid data
- [ ] Test all endpoints with invalid data
- [ ] Test authentication (missing token, invalid token)
- [ ] Test authorization (wrong role)
- [ ] Test error responses (400, 404, 500)

### Performance Testing
- [ ] Form submission time < 2 seconds
- [ ] Search filter response < 200ms
- [ ] Table pagination smooth
- [ ] No memory leaks (DevTools)

### Security Testing
- [ ] XSS attempts blocked
- [ ] SQL injection attempts blocked
- [ ] CSRF token validation
- [ ] Authorization checks on backend

---

## Success Criteria ✅

All tests should pass for Phase 1 to be considered complete:
- [ ] 90%+ positive cases passing
- [ ] All critical edge cases handled
- [ ] No console errors
- [ ] No unhandled promises
- [ ] Performance metrics met
- [ ] Security validations passed
- [ ] Cross-browser compatible
- [ ] Mobile responsive

---

## Bug Reporting Template

```
**Title**: [Component] Short bug description

**Steps to Reproduce**:
1. ...
2. ...

**Expected Result**:
...

**Actual Result**:
...

**Environment**:
- Browser: ...
- OS: ...
- Screen Size: ...

**Screenshots**:
[Attach if applicable]

**Severity**: Critical / High / Medium / Low
```
