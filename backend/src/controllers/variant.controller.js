const variantService = require("../services/variant.service");
const ApiError = require("../api-error");
const JSend = require("../jsend");

// Variants
async function addVariant(req, res, next) {
  try {
    const variant = await variantService.addVariant(req.body.product_id, req.body);
    return res.status(201).json(JSend.success({ variant }));
  } catch (err) {
    console.error('Error adding variant:', err);
    return next(new ApiError(500, err.message || "Error adding variant"));
  }
}

async function removeVariant(req, res, next) {
  try {
    const removed = await variantService.removeVariant(req.params.variantId);
    if (!removed) return next(new ApiError(404, "Variant not found"));
    return res.json(JSend.success({ message: "Variant removed" }));
  } catch (err) {
    return next(new ApiError(500, "Error removing variant"));
  }
}

async function hardDeleteVariant(req, res, next) {
  try {
    const deleted = await variantService.hardDeleteVariant(req.params.variantId);
    if (!deleted) return next(new ApiError(404, "Variant not found"));
    return res.json(JSend.success({ message: "Variant deleted" }));
  } catch (err) {
    return next(new ApiError(500, "Error deleting variant"));
  }
}

async function restoreVariant(req, res, next) {
  try {
    const restored = await variantService.restoreVariant(req.params.variantId);
    if (!restored) return next(new ApiError(404, "Variant not found"));
    return res.json(JSend.success({ message: "Variant restored" }));
  } catch (err) {
    return next(new ApiError(500, "Error restoring variant"));
  }
}

async function updateVariant(req, res, next) {
  try {
    const updated = await variantService.updateVariant(req.params.variantId, req.body);
    if (!updated) return next(new ApiError(404, "Variant not found"));
    return res.json(JSend.success({ variant: updated }));
  } catch (err) {
    return next(new ApiError(500, "Error updating variant"));
  }
}

module.exports = {
  addVariant,
  removeVariant,
  hardDeleteVariant,
  restoreVariant,
  updateVariant
};