const express = require("express");
const router = express.Router();
const variantController = require("../controllers/variant.controller");
const { methodNotAllowed } = require("../controllers/errors.controller");
module.exports.setup = (app) => {
    app.use("/api/v1/variants", router);
    router.post("/", variantController.addVariant);
    router.delete("/:variantId", variantController.removeVariant);
    router.put("/:variantId", variantController.updateVariant);
    router.delete("/:variantId/permanent", variantController.hardDeleteVariant);
    router.patch("/:variantId/restore", variantController.restoreVariant);
    router.all("/", methodNotAllowed);
    router.all("/:variantId", methodNotAllowed);
};