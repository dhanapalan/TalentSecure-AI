import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAndValidateCollegeMaster } from "../services/collegeMasterFields.service.js";

const validBody = {
  name: "Test Engineering College",
  establishmentYear: 1998,
  institutionType: "Affiliated College",
  ownership: "Private",
  categories: ["Engineering"],
  addressLine1: "12 College Road",
  city: "Chennai",
  district: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  pincode: "600001",
  website: "www.testcollege.edu",
  email: "info@testcollege.edu",
  phone: "+919876543210",
  affiliatedUniversity: "Anna University",
  tpoName: "Dr Test",
  tpoEmail: "tpo@testcollege.edu",
};

describe("parseAndValidateCollegeMaster", () => {
  it("accepts a complete valid payload and normalizes website", () => {
    const parsed = parseAndValidateCollegeMaster(validBody);
    assert.equal(parsed.website, "https://www.testcollege.edu");
    assert.equal(parsed.country, "India");
    assert.deepEqual(parsed.categories, ["Engineering"]);
  });

  it("requires affiliated university for Affiliated College", () => {
    assert.throws(
      () =>
        parseAndValidateCollegeMaster({
          ...validBody,
          affiliatedUniversity: "",
        }),
      /Affiliated university is required/
    );
  });

  it("rejects Indian pincode that is not 6 digits", () => {
    assert.throws(
      () => parseAndValidateCollegeMaster({ ...validBody, pincode: "60001" }),
      /exactly 6 digits/
    );
  });

  it("rejects phone without country code", () => {
    assert.throws(
      () => parseAndValidateCollegeMaster({ ...validBody, phone: "9876543210" }),
      /country code/
    );
  });

  it("can skip TPO validation for updates", () => {
    const parsed = parseAndValidateCollegeMaster(
      { ...validBody, tpoName: "", tpoEmail: "" },
      { requireTpo: false }
    );
    assert.equal(parsed.name, "Test Engineering College");
  });
});
