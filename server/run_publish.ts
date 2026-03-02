import { publishDrive } from "./src/services/drive.service.js";

async function run() {
    try {
        console.log("Calling publishDrive...");
        const res = await publishDrive('c13dfaf3-e253-4312-9ae2-ad6e3d74c440');
        console.log("Success!", res);
        process.exit(0);
    } catch (err) {
        console.error("Caught error:", err);
        process.exit(1);
    }
}
run();
