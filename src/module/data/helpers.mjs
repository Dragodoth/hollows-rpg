
const { NumberField, StringField } = foundry.data.fields;

/**
 * Constructs a number field that is always a number with a min of 0.
 * @param {object} [options] Options to forward to the field.
 * @param {number} [options.initial=0]  The initial value for the field.
 * @param {number} [options.min=0]      The minimum value for the field.
 * @param {number} [options.max]        The maximum value for the field.
 * @param {string} [options.label]      Label for the field.
 * @returns A number field that is non-nullable and always defined.
 */
export const requiredInteger = ({ initial = 0, min = 0, max, label } = {}) => new NumberField({ initial, label, min, max, required: true, nullable: false, integer: true });

/* -------------------------------------------------- */

/**
 * Constructs a string field for use inside of a SetField.
 * @param {object} [options] Options to forward to the field.
 * @param {Record<string, string>} [options.choices] CONST-derived choices for the field.
 * @param {Function} [options.validate] A validator function for field values.
 * @returns A string field that is always truthy.
 */
export const setOptions = ({ choices, validate } = {}) => new StringField({ required: true, blank: false, choices, validate });