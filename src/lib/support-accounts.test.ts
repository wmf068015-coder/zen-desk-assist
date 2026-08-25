import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SUPPORT_ACCOUNTS,
  getDefaultSupportAccountPermissions,
  updateSupportAccount,
} from "./support-accounts.ts";

describe("support accounts", () => {
  it("maps account roles to their default module permissions", () => {
    assert.deepEqual(getDefaultSupportAccountPermissions("online"), ["workbench", "tickets"]);
    assert.deepEqual(getDefaultSupportAccountPermissions("email"), ["tickets"]);
  });

  it("removes online presence when an account becomes email-only", () => {
    const accounts = updateSupportAccount(DEFAULT_SUPPORT_ACCOUNTS, "agent-xiaomei", {
      role: "email",
    });

    assert.equal(accounts[0].role, "email");
    assert.equal(accounts[0].presence, null);
    assert.deepEqual(accounts[0].permissions, ["tickets"]);
  });

  it("restores an idle presence when an email account becomes an online account", () => {
    const accounts = updateSupportAccount(DEFAULT_SUPPORT_ACCOUNTS, "agent-xiaolin", {
      role: "online",
    });

    assert.equal(accounts[2].role, "online");
    assert.equal(accounts[2].presence, "idle");
    assert.deepEqual(accounts[2].permissions, ["workbench", "tickets"]);
  });

  it("supports adding and removing modules for one account", () => {
    const accounts = updateSupportAccount(DEFAULT_SUPPORT_ACCOUNTS, "agent-xiaomei", {
      permissions: ["tickets", "knowledge"],
    });

    assert.deepEqual(accounts[0].permissions, ["tickets", "knowledge"]);
    assert.deepEqual(accounts[1].permissions, ["workbench", "tickets"]);
  });
});
