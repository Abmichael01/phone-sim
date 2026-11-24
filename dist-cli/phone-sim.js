#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { request } from "node:http";
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
var Cached = class {
	constructor(getter) {
		this._getter = getter;
		this._value = void 0;
	}
	get value() {
		const getter = this._getter;
		if (getter !== void 0) {
			this._value = getter();
			this._getter = void 0;
		}
		return this._value;
	}
};
function cached(getter) {
	return new Cached(getter);
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
/**
* Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
*
* Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
*/
function rawShape(def) {
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
	return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
	Object.defineProperty(target, key, {
		get() {
			const value = getter();
			assignProp(this, key, value);
			return value;
		},
		enumerable: true,
		configurable: true
	});
}
function putProp(target, key, value) {
	if (key in target) assignProp(target, key, value);
	else target[key] = value;
}
/**
* Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
*
* A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one schema.
*/
function mirrorShape(target, source, keys, wrap) {
	const raw = sourceShape(source);
	for (const key of keys) {
		const desc = Object.getOwnPropertyDescriptor(raw, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => {
			const value = source._zod.def.shape[key];
			return wrap ? wrap(value, key) : value;
		});
		else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
	}
}
function mirrorProps(target, source) {
	for (const key of Reflect.ownKeys(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => source[key]);
		else putProp(target, key, desc.value);
	}
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
var propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
var NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	const newShape = {};
	mirrorShape(newShape, schema, maskedKeys(schema, mask));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function maskedKeys(schema, mask) {
	const raw = sourceShape(schema);
	const keys = [];
	for (const key of Reflect.ownKeys(mask)) {
		if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
		if (mask[key]) keys.push(key);
	}
	return keys;
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	const omitted = new Set(maskedKeys(schema, mask));
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = sourceShape(schema);
		for (const key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
	mirrorProps(newShape, shape);
	return newShape;
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
	if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	const newShape = {};
	mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
	mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
	return clone(a, mergeDefs(a._zod.def, {
		shape: newShape,
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask, name = "partial") {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({
		type: "optional",
		innerType: value
	})));
	return clone(schema, mergeDefs(schema._zod.def, {
		shape: newShape,
		checks: []
	}));
}
function required(Class, schema, mask) {
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({
		type: "nonoptional",
		innerType: value
	}));
	return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
/** The leading size checks of `defChecks` that set an upper bound, each paired with it. */
function sizeCaps(defChecks) {
	const caps = [];
	for (const ch of defChecks ?? []) {
		const d = ch._zod.def;
		if (!/_(length|size)$|_equals$/.test(d.check)) break;
		const max = d.maximum ?? d.length ?? d.size;
		if (max >= 0) caps.push([max, ch]);
	}
	return caps;
}
function attachSchema(issues, start, inst) {
	var _a;
	for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
	var _a;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) {
		if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
		else iss.schema = iss.inst;
	}
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const full = {};
	for (const k of Object.keys(iss)) {
		if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
		full[k] = iss[k];
	}
	full.path ?? (full.path = []);
	full.message = message;
	if (ctx?.reportInput) full.input = iss.input;
	return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
	const units = str.length;
	if (!highSurrogate.test(str)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
/**
* Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
*
* Call this from a `proto` initializer, which runs once per prototype — never per instance.
*/
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
/* @__NO_SIDE_EFFECTS__ */
function derived(computes, table) {
	for (const key in computes) {
		const compute = computes[key];
		Object.defineProperty(table, key, {
			configurable: true,
			enumerable: true,
			get() {
				return own(this, key, compute(this));
			},
			set(value) {
				own(this, key, value);
			}
		});
	}
	return table;
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
/**
* Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
* constructor, computed from the internals object itself and cached there on
* first read. One accessor per constructor rather than one per instance.
*/
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
/**
* Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
* data property. One accessor per constructor rather than one per instance, because an own accessor
* puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
*/
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
var CONSTANT_CATCH = "~constantCatch";
/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
function constantCatch(value) {
	const fn = () => value;
	fn[CONSTANT_CATCH] = true;
	return fn;
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/core.js
var _a$1;
/** A special constant with type `never` */
var NEVER = /*@__PURE__*/ Object.freeze({ status: "aborted" });
var _zodDesc = {
	value: void 0,
	enumerable: false
};
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
/* @__NO_SIDE_EFFECTS__ */
function $constructor(name, initializer, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc);
			} finally {
				_zodDesc.value = void 0;
			}
		} else if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		if (initialized) {
			const own = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto = _.prototype;
		for (const k in proto) {
			if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/errors.js
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
var _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
var _issuesDesc = {
	value: void 0,
	enumerable: false
};
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
var $ZodError = /* @__PURE__ */ $constructor("$ZodError", initializer$1);
/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
* ("toString", "constructor") would otherwise read through to the prototype, and assigning
* "__proto__" would hit the setter instead of creating a key. */
function node(obj, key, make) {
	if (!Object.prototype.hasOwnProperty.call(obj, key)) {
		if (key === "__proto__") Object.defineProperty(obj, key, {
			value: make(),
			writable: true,
			enumerable: true,
			configurable: true
		});
		else obj[key] = make();
	}
	return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
	else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					const terminal = i === fullpath.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
						value: { _errors: [] },
						enumerable: true,
						writable: true,
						configurable: true
					});
					const node = curr[el];
					if (terminal) node._errors.push(mapper(issue));
					curr = node;
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
	return {
		callee: params?.callee ?? callee,
		Err: params?.Err
	};
}
var _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
var _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
function failure(Err, issues, ctx) {
	let error;
	return {
		success: false,
		get error() {
			if (!error) {
				error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
				issues = void 0;
				ctx = void 0;
			}
			return error;
		},
		set error(e) {
			error = e;
			issues = void 0;
			ctx = void 0;
		}
	};
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = ((schema, value, _ctx) => {
	const validator = schema._zod.bag.validator;
	if (validator !== void 0) {
		if (validator(value) !== COMPILE_INVALID) return true;
		if (validator.definite === true && _ctx === void 0) return false;
	}
	return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
	const ctx = _ctx ? {
		..._ctx,
		async: false,
		abortEarly: true
	} : {
		async: false,
		abortEarly: true
	};
	const fallbackRun = schema._zod.bag.fallbackRun;
	let result;
	if (fallbackRun) {
		ctx[COMPILE_FALLBACK] = true;
		result = fallbackRun({
			value,
			issues: []
		}, ctx);
	} else result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length === 0;
}
var validateAsync$1 = async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true,
		abortEarly: true
	} : {
		async: true,
		abortEarly: true
	};
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length === 0;
};
var _encode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return parse(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _decode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _encodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _decodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/regexes.js
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
	return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
var uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji$1 = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
* esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
* will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source) {
	return new RegExp(`^${source}$`);
}
var date = /*@__PURE__*/ anchor(dateSource);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
	const opts = ["Z"];
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const qualified = `${timeSource({
		precision: args.precision,
		seconds: true
	})}(?:${opts.join("|")})`;
	const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var number$1 = /^-?\d+(?:\.\d+)?$/;
var boolean$1 = /^(?:true|false)$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/checks.js
var $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
var _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
var $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	def.pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = [], closed = {}) {
		this.content = [];
		this.indent = 0;
		this.args = args;
		this.closed = closed;
	}
	indented(fn) {
		this.indent += 1;
		try {
			fn(this);
		} finally {
			this.indent -= 1;
		}
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const content = this?.content ?? [``];
		return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`)(...Object.values(this.closed));
	}
};
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/versions.js
var version$1 = {
	major: 4,
	minor: 6,
	patch: 7
};
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/schemas.js
var $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version$1;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
	const ctx = { async: true };
	return toStandardResult(await inst._zod.run({
		value,
		issues: []
	}, ctx), ctx);
}
function standardProps(inst) {
	return {
		validate: (value) => {
			const ctx = { async: false };
			try {
				const r = inst._zod.run({
					value,
					issues: []
				}, ctx);
				if (!(r instanceof Promise)) return toStandardResult(r, ctx);
			} catch (_) {}
			return validateAsync(inst, value);
		},
		vendor: "zod",
		version: 1
	};
}
var $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = def.pattern ?? anyString;
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
var $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
var $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
var $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
var $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
function canParseURL(input) {
	try {
		if (typeof URL !== "undefined" && typeof URL.canParse === "function") return URL.canParse(input);
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
function validateURL(trimmed, def) {
	if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || 2;
	return parseURLObject(trimmed, def);
}
/** Parses a URL while preserving the non-normalizing HTTP guard. */
function parseURLObject(trimmed, def) {
	if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return 1;
	try {
		if (typeof URL !== "undefined") {
			const URLStatic = URL;
			if (typeof URLStatic.parse === "function") return URLStatic.parse(trimmed) ?? 2;
		}
		return new URL(trimmed);
	} catch {
		return 2;
	}
}
var asciiTabOrNewline = /[\t\n\r]/g;
/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
function stripTabAndNewline(value) {
	return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
	hostname.lastIndex = 0;
	return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
	protocol.lastIndex = 0;
	return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
var $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = validateURL(trimmed, def);
			if (url === 1) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === 2) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === true) {
				payload.value = stripTabAndNewline(trimmed);
				return;
			}
			if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: def.hostname.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: def.protocol.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
var $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
	if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
	def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
	$ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
var $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
var $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date);
	$ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration);
	$ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
});
/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
	if (!ipv6Alphabet.test(value)) return false;
	return canParseURL(`http://[${value}]`);
}
var $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidIPv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
	const parts = value.split("/");
	if (parts.length !== 2) return false;
	const [address, prefix] = parts;
	if (!prefix) return false;
	const prefixNum = Number(prefix);
	if (`${prefixNum}` !== prefix) return false;
	if (prefixNum < 0 || prefixNum > 128) return false;
	return isValidIPv6(address);
}
var $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidCIDRv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64Charset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
	if (!base64urlCharset.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
var $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64urlCharset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
var $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
var $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
var $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
var $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
var $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function capSize(inst, size) {
	const caps = sizeCaps(inst._zod.def.checks);
	if (!caps.length) return;
	const cap = Math.min(...caps.map((c) => c[0]));
	const parse = inst._zod.parse;
	inst._zod.parse = (payload, ctx) => {
		const n = size(payload.value);
		if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
			for (const [max, ch] of sizeCaps(inst._zod.def.checks)) if (n > max && ch._zod.def.when(payload)) {
				const start = payload.issues.length;
				ch._zod.check(payload);
				payload.issues[start].continue = false;
				attachSchema(payload.issues, start, inst);
				return payload;
			}
		}
		return parse(payload, ctx);
	};
}
var arraySize = (input) => Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
var $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		const abortEarly = ctx?.abortEarly;
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else {
				handleArrayResult(result, payload, i);
				if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
	capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	let seen = 0;
	for (const key in input) {
		if (abortEarly && payload.issues.length !== seen) {
			if (aborted(payload, seen)) break;
			seen = payload.issues.length;
		}
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
var $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	const sh = desc?.get ? desc.get.raw : def.shape ?? {};
	if (sh) {
		const get = () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			get.raw = newSh;
			return newSh;
		};
		get.raw = sh;
		Object.defineProperty(def, "shape", { get });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		const abortEarly = ctx?.abortEarly;
		let seen = payload.issues.length;
		for (const key of value.allKeys) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
	};
});
var $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const memo = globalConfig.memoizer;
	const generateFastpass = (shape) => {
		const normalized = _normalized.value;
		const syms = normalized.symbolKeys;
		const doc = new Doc(["payload", "ctx"], {
			shape,
			inst,
			memo,
			syms
		});
		const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.allKeys) ids[key] = `key_${counter++}`;
		doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
		for (const key of normalized.allKeys) {
			if (key === "__proto__") continue;
			const id = ids[key];
			const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
			const isPresent = `${k} in input`;
			const schema = shape[key];
			const optin = schema?._zod?.optin;
			const isOptionalIn = optin !== void 0;
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(k)};`);
			if (isOptionalIn && isOptionalOut) {
				const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
				doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			} else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
			else {
				doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
				if (optin === "defaulted") doc.write(`newResult[${k}] = ${id}.value;`);
				else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
			}
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		return doc.compile();
	};
	let fastpass;
	const isObject$2 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
var $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
	defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazyInternal(inst, "values", (zod) => {
		if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		if (zod.def.options.every((o) => o._zod.pattern)) {
			const patterns = zod.def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
var $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	const keyIssues = /* @__PURE__ */ new Map();
	const collect = (iss, side) => {
		let keys;
		if (iss.code === "unrecognized_keys" && !iss.path?.length) {
			unrecIssue ?? (unrecIssue = iss);
			keys = iss.keys;
		} else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
			const k = String(iss.path[0]);
			if (!keyIssues.has(k)) keyIssues.set(k, iss);
			keys = [k];
		} else return false;
		for (const k of keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k)[side] = true;
		}
		return true;
	};
	for (const iss of left.issues) if (!collect(iss, "l")) result.issues.push(iss);
	for (const iss of right.issues) if (!collect(iss, "r")) result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length) {
		const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
		if (aggregated.length) result.issues.push({
			...unrecIssue,
			keys: aggregated
		});
		for (const k of bothKeys) if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
	}
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) {
		if (aborted(result)) return result;
		throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	}
	result.value = merged.data;
	return result;
}
var $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	defineLazyInternal(inst, "pattern", (zod) => {
		const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
		return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	const values = new Set(def.values);
	inst._zod.values = values;
	defineLazyInternal(inst, "pattern", (zod) => {
		const vals = zod.def.values;
		return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	globalConfig.memoizer?.guard(inst);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
var $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
var $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => {
		const v = zod.def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
function handleCatchResult(payload, result, def, ctx) {
	if (!result.issues.length) {
		payload.value = result.value;
		if (result.memo) payload.memo = true;
		return payload;
	}
	payload.value = def.catchValue({
		...result,
		value: payload.value,
		error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
		input: payload.value
	});
	return payload;
}
var $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run({
			value: payload.value,
			issues: []
		}, ctx);
		if (result instanceof Promise) return result.then((result) => handleCatchResult(payload, result, def, ctx));
		return handleCatchResult(payload, result, def, ctx);
	};
});
var $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
var $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	if (!payload.memo) payload.value = Object.freeze(payload.value);
	return payload;
}
var $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
	constructor() {
		super(`Cannot parse a reference cycle that closes through a transform`);
		this.name = "ZodCyclicError";
	}
};
/** Keyed off the context object every schema in one parse call already shares. */
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
	return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
	return issues.map((iss) => iss.path ? {
		...iss,
		path: iss.path.slice()
	} : { ...iss });
}
var recursive = /*@__PURE__*/ new WeakMap();
/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst, stack, resolve) {
	const cached = recursive.get(inst);
	if (cached !== void 0) return cached ? PROVEN : NONE;
	if (stack.has(inst)) return PROVEN;
	stack.add(inst);
	let result = NONE;
	const check = (child) => {
		if (result !== PROVEN && child?._zod) {
			const answer = isRecursive(child, stack, resolve);
			if (answer > result) result = answer;
		}
	};
	const shape = (sh, spread) => {
		let answer = NONE;
		for (const key of Reflect.ownKeys(sh)) {
			const desc = Object.getOwnPropertyDescriptor(sh, key);
			if (spread && !desc.enumerable) continue;
			const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
			if (child > answer) answer = child;
		}
		return answer;
	};
	const merge = (answer) => {
		if (answer > result) result = answer;
	};
	const def = inst._zod.def;
	switch (def.type) {
		case "object": {
			const raw = rawShape(def);
			merge(raw ? shape(raw, true) : ASSUMED);
			check(def.catchall);
			break;
		}
		case "array":
			check(def.element);
			break;
		case "tuple":
			for (const el of def.items) check(el);
			check(def.rest);
			break;
		case "record":
		case "map":
			check(def.keyType);
			check(def.valueType);
			break;
		case "set":
			check(def.valueType);
			break;
		case "union":
			for (const el of def.options) check(el);
			break;
		case "intersection":
			check(def.left);
			check(def.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			check(def.innerType);
			break;
		case "pipe":
			check(def.in);
			check(def.out);
			break;
		case "function":
			check(def.input);
			check(def.output);
			break;
		case "lazy": {
			const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
			merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (const key in def) {
			const desc = Object.getOwnPropertyDescriptor(def, key);
			if (!desc || desc.get) continue;
			const value = desc.value;
			if (!value || typeof value !== "object") continue;
			if (value._zod) check(value);
			else if (Array.isArray(value)) for (const el of value) check(el);
		}
	}
	stack.delete(inst);
	return settle(inst, result);
}
/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst, answer) {
	if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
	return answer;
}
function bucketFor(state, inst) {
	let bucket = state.buckets.get(inst);
	if (!bucket) {
		bucket = /* @__PURE__ */ new WeakMap();
		state.buckets.set(inst, bucket);
	}
	return bucket;
}
var handoff;
var open = [];
var memo = {
	alloc(_inst, payload, empty) {
		const bucket = handoff;
		if (!bucket) return empty;
		handoff = void 0;
		const entry = {
			value: empty,
			issues: null
		};
		bucket.set(payload.value, entry);
		open.push(entry);
		return empty;
	},
	guard(inst) {
		var _a;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
				return base(payload, ctx);
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	},
	attach(inst) {
		var _a;
		let isRecursiveInst;
		let rechecked = false;
		let lastCtx;
		let lastBucket;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (isRecursiveInst === void 0) {
					const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
					if (walked === NONE) {
						inst._zod.parse = base;
						if (inst._zod.run === wrapped) inst._zod.run = base;
						return base(payload, ctx);
					}
					if (walked === PROVEN || rechecked) isRecursiveInst = true;
					else rechecked = true;
				}
				const input = payload.value;
				if (!isRef(input)) return base(payload, ctx);
				let state = ctx[STATE];
				if (!state) {
					state = {
						buckets: /* @__PURE__ */ new WeakMap(),
						backEdges: void 0
					};
					ctx[STATE] = state;
				}
				let bucket;
				if (lastCtx === ctx) bucket = lastBucket;
				else {
					bucket = bucketFor(state, inst);
					lastCtx = ctx;
					lastBucket = bucket;
				}
				const hit = bucket.get(input);
				if (hit) {
					payload.value = hit.value;
					if (hit.issues) {
						if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
					} else {
						payload.memo = true;
						state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
						state.backEdges.add(hit.value);
					}
					return payload;
				}
				handoff = bucket;
				const depth = open.length;
				const result = base(payload, ctx);
				handoff = void 0;
				const entry = open.length > depth ? open.pop() : void 0;
				if (result instanceof Promise) return result.then((r) => {
					if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
					return r;
				});
				if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
				return result;
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	}
};
/** The memoizer that gives containers cycle support. `zod` installs it by default; `zod/mini` opts in with `config({ memoizer: memoizer() })`. */
function memoizer() {
	return memo;
}
/** Whether this value is a node a back-edge resolved to before it finished. */
function isBackEdge(ctx, value) {
	const backEdges = ctx[STATE]?.backEdges;
	return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/locales/en.js
var error = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	function getTypeName(type, input) {
		if (type === "number" && typeof input === "number" && !Number.isFinite(input)) return String(input);
		return TypeDictionary[type] ?? type;
	}
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": return `Invalid input: expected ${getTypeName(issue.expected)}, received ${getTypeName(parsedType(issue.input), issue.input)}`;
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union":
				if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) return `Invalid discriminator value. Expected ${issue.options.map((o) => `'${o}'`).join(" | ")}`;
				if (issue.inclusive === false) return "Invalid input: more than one option matched";
				return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error() };
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
	if (def.checks) def.checks = [...def.checks];
	return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class(snapshotChecks({
		type: "string",
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link _cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class(snapshotChecks({
		type: "number",
		checks: [],
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
	for (const source of sources) for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProp(target, key, source[key]);
	return target;
}
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: params?.external ?? void 0
	};
}
/**
* Applies the `unrepresentable` setting at a site that has no JSON Schema equivalent. Throws
* `message` unless the setting (or the handler's return value) says otherwise. Returns `true` if a
* custom JSON Schema was written into `json`, in which case the caller must not write its own.
*/
function handleUnrepresentable(schema, ctx, json, params, message) {
	const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({
		zodSchema: schema,
		path: params.path,
		message
	}) : ctx.unrepresentable;
	if (result === "any") return false;
	if (result === void 0 || result === "throw") throw new Error(message);
	Object.assign(json, result);
	return true;
}
function processSchema(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	ctx.sharedDefsExtractedFor = void 0;
	ctx.sharedEmitDoneFor = void 0;
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			processSchema(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) assignProps(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function encodeJSONPointerSegment(segment) {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
			};
		}
		const uriPrefix = `#`;
		const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
		if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + encodeJSONPointerSegment(defId)
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") extractToDef(entry);
		}
	}
	if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
/** Rewrites `anyOf: [{type: "a"}, {type: "b"}]` to `type: ["a", "b"]`, which every JSON Schema draft treats as equivalent and most consumers render far better for the nullable case. Only branches that are a bare type assertion qualify — anything carrying a constraint, `$ref`, `const` or metadata is left alone. Runs after `flattenRef`, so a branch an override decorated or `$defs` extraction turned into a `$ref` is no longer bare and correctly stays in `anyOf`. `oneOf` is excluded: `integer` and `number` overlap, so "exactly one" and "at least one" are not the same there. OpenAPI 3.0 is excluded: its `type` must be a single string. */
function compactTypeUnion(schema) {
	const options = schema.anyOf;
	if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
	const types = [];
	for (const option of options) {
		if (!option || typeof option !== "object") return;
		compactTypeUnion(option);
		const keys = Object.keys(option);
		if (keys.length !== 1 || keys[0] !== "type") return;
		const type = option.type;
		for (const member of Array.isArray(type) ? type : [type]) {
			if (typeof member !== "string") return;
			if (!types.includes(member)) types.push(member);
		}
	}
	delete schema.anyOf;
	schema.type = types.length === 1 ? types[0] : types;
}
/** Keywords `foldIntersection` knows how to combine. Anything else — `$ref`, `patternProperties`,
* an annotation like `description` — makes a member unfoldable, so a constraint this does not
* understand leaves the `allOf` alone instead of being silently dropped or misattributed. */
var FOLDABLE_KEYS = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]);
var UNION_KEYS = ["oneOf", "anyOf"];
/** A member's constraint on a key it does not declare itself. A `catchall` states one; `false`, an absent `additionalProperties`, and the empty schema a loose object emits state nothing. */
function undeclaredConstraint(member) {
	const extra = member.additionalProperties;
	if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null) return null;
	return Object.keys(extra).length ? extra : null;
}
/** Combines object members into the single object they describe together, or returns `null` if any of them carries a keyword outside {@link FOLDABLE_KEYS}. */
function foldObjects(members) {
	const objects = [];
	for (const member of members) {
		if (typeof member !== "object" || member.type !== "object") return null;
		for (const key in member) if (!FOLDABLE_KEYS.has(key)) return null;
		objects.push(member);
	}
	const properties = {};
	const required = /* @__PURE__ */ new Set();
	for (const object of objects) {
		for (const key in object.properties) {
			if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
			const parts = [];
			for (const other of objects) {
				const part = other.properties?.[key] ?? undeclaredConstraint(other);
				if (part === null || part === void 0) continue;
				if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
			}
			assignProp(properties, key, parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts });
		}
		for (const key of object.required ?? []) required.add(key);
	}
	const folded = {
		type: "object",
		properties
	};
	if (required.size) folded.required = [...required];
	if (objects.every((object) => object.additionalProperties === false)) folded.additionalProperties = false;
	else {
		const constraints = [];
		for (const object of objects) {
			const constraint = undeclaredConstraint(object);
			if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
		}
		if (constraints.length === 1) folded.additionalProperties = constraints[0];
		else if (constraints.length > 1) folded.additionalProperties = { allOf: constraints };
	}
	return folded;
}
/** `additionalProperties` in an `allOf` member sees only that member's own `properties`, so two
* closed object members reject each other's keys and the schema validates nothing. Zod's parser
* pools the key sets instead — `handleIntersectionResults` reports a key as unrecognized only when
* *every* side rejects it — so the emitted schema has to pool them too, and folding the members
* into one object is the encoding that says so on every target.
*
* This runs from `finalize`, after `extractDefs`, which is what keeps it clear of the `$ref`
* machinery: a member extracted into `$defs` is already a `$ref` by now and declines to fold, so it
* keeps its reference and its own closedness rather than being inlined as a stale copy. */
function foldIntersection(json) {
	const allOf = json.allOf;
	if (!Array.isArray(allOf) || allOf.length < 2) return;
	for (const key of FOLDABLE_KEYS) if (key in json) return;
	const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
	let folded = null;
	if (!unions.length) folded = foldObjects(allOf);
	else {
		const union = unions[0];
		const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
		if (Object.keys(union).length !== 1) return;
		const rest = allOf.filter((m) => m !== union);
		const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
		if (branches.some((b) => !b)) return;
		folded = { [keyword]: branches };
	}
	if (!folded) return;
	delete json.allOf;
	assignProps(json, folded);
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else assignProps(schema, refSchema);
			assignProps(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
		for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
		if (ctx.target !== "openapi-3.0") for (const entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
		for (const rewrite of ctx.deferred) rewrite();
		if (ctx.intersections.length) {
			const carriers = /* @__PURE__ */ new Map();
			for (const seen of ctx.seen.values()) for (const json of [seen.schema, seen.def]) {
				const allOf = json?.allOf;
				if (!Array.isArray(allOf)) continue;
				const existing = carriers.get(allOf);
				if (existing) existing.push(json);
				else carriers.set(allOf, [json]);
			}
			for (const allOf of ctx.intersections) for (const json of carriers.get(allOf) ?? []) foldIntersection(json);
		}
	}
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			assignProp(defs, seen.defId, seen.def);
		}
	}
	if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
	if (ctx.external) {} else if (Object.keys(defs).length > 0) {
		if (ctx.target === "draft-2020-12") result.$defs = defs;
		else result.definitions = defs;
	}
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = (agg, key, value) => {
	if (agg[key] === void 0 || value > agg[key]) agg[key] = value;
};
var narrowMax = (agg, key, value) => {
	if (agg[key] === void 0 || value < agg[key]) agg[key] = value;
};
var narrowBoth = (agg, value) => {
	narrowMin(agg, "minimum", value);
	narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
	agg.multipleOf ?? (agg.multipleOf = []);
	if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
	agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
	agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
	agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format) => {
	agg.format = format;
	if (format.includes("int")) agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
	setFormat(agg, def.format);
	const [minimum, maximum] = ranges[def.format];
	narrowMin(agg, "minimum", minimum);
	narrowMax(agg, "maximum", maximum);
};
var contributors = {
	greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
	less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
	multiple_of: (agg, def) => addDivisor(agg, def.value),
	number_format: formatContributor(NUMBER_FORMAT_RANGES),
	bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
	min_length: minContributor,
	max_length: maxContributor,
	length_equals: (agg, def) => narrowBoth(agg, def.length),
	min_size: minContributor,
	max_size: maxContributor,
	size_equals: (agg, def) => narrowBoth(agg, def.size),
	string_format: (agg, def) => {
		setFormat(agg, def.format);
		if (def.pattern) addPattern(agg, def.pattern);
		if (def.format === "base64" || def.format === "base64url") agg.contentEncoding = def.format;
		if (def.local || def.precision === -1) agg.laxFormat = true;
	},
	mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
	const agg = {};
	const def = schema._zod.def;
	const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
	for (const ch of list) contributors[ch._zod.def.check]?.(agg, ch._zod.def);
	const bag = schema._zod.bag;
	if (bag.minimum !== void 0) narrowMin(agg, "minimum", bag.minimum);
	if (bag.exclusiveMinimum !== void 0) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
	if (bag.maximum !== void 0) narrowMax(agg, "maximum", bag.maximum);
	if (bag.exclusiveMaximum !== void 0) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
	if (bag.multipleOf !== void 0) addDivisor(agg, bag.multipleOf);
	if (bag.format !== void 0) {
		agg.format ?? (agg.format = bag.format);
		if (bag.format.includes("int")) agg.isInt = true;
	}
	if (bag.mime) intersectMime(agg, bag.mime);
	for (const pattern of bag.patterns ?? []) addPattern(agg, pattern);
	return agg;
}
var formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
var exactPatterns = /* @__PURE__ */ new Map([[base64Charset, base64], [base64urlCharset, base64url]]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time" || laxFormat) delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const patternList = [...patterns].map(exactPattern);
		if (patternList.length === 1) json.pattern = patternList[0].source;
		else if (patternList.length > 1) json.allOf = [...patternList.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
var numberProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
	json.type = isInt ? "integer" : "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) {
		if (legacy) {
			json.minimum = exclusiveMinimum;
			json.exclusiveMinimum = true;
		} else json.exclusiveMinimum = exclusiveMinimum;
	} else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) {
		if (legacy) {
			json.maximum = exclusiveMaximum;
			json.exclusiveMaximum = true;
		} else json.exclusiveMaximum = exclusiveMaximum;
	} else if (typeof maximum === "number") json.maximum = maximum;
	if (multipleOf) {
		const divisors = /* @__PURE__ */ new Set();
		for (const divisor of multipleOf) if (Number.isFinite(divisor) && divisor !== 0) divisors.add(Math.abs(divisor));
		else handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
		const [first, ...rest] = divisors;
		if (first !== void 0) json.multipleOf = first;
		if (rest.length) json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
	}
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
var neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
var enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.length === 0) {
		json.not = {};
		return;
	}
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
var literalProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	if (def.values.length === 0) {
		json.not = {};
		return;
	}
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof val === "bigint") {
		if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
		vals.push(Number(val));
	} else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
var customProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = processSchema(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
function inputOptin(schema) {
	const def = schema._zod.def;
	if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
	if (def.type === "catch") return inputOptin(def.innerType);
	return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const shape = def.shape;
	if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
	json.type = "object";
	json.properties = {};
	for (const key in shape) assignProp(json.properties, key, processSchema(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	}));
	const requiredKeys = [];
	for (const key of Object.keys(shape)) {
		const field = def.shape[key];
		if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) requiredKeys.push(key);
	}
	if (requiredKeys.length > 0) json.required = requiredKeys;
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = processSchema(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
var unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => processSchema(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
var intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = processSchema(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = processSchema(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	const allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
	json.allOf = allOf;
	ctx.intersections.push(allOf);
};
var nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
/** Round-trips a default value through JSON so the emitted schema is guaranteed to be valid JSON.
* A BigInt has no reliable encoding, so it goes through `unrepresentable` like any other
* unrepresentable value. Returns a sentinel when the caller must not write a default of its own. */
var UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
	let unrepresentable = false;
	const serialized = JSON.stringify(value, (_, val) => {
		if (typeof val !== "bigint") return val;
		unrepresentable = true;
		return null;
	});
	if (!unrepresentable) return JSON.parse(serialized);
	handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
	return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
var prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io !== "input") return;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
var catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	processSchema(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
	Object.defineProperty(proto, key, {
		configurable: true,
		enumerable: false,
		get() {
			const value = make(this);
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
			return value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
		}
	});
}
var initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	const proto = Object.getPrototypeOf(inst);
	if (_installedErrorProtos.has(proto)) return;
	_installedErrorProtos.add(proto);
	_lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
	_lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
	_lazyMethod(proto, "addIssue", (self) => (issue) => {
		self.issues.push(issue);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	_lazyMethod(proto, "addIssues", (self) => (issues) => {
		self.issues.push(...issues);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	Object.defineProperty(proto, "isEmpty", {
		configurable: true,
		enumerable: false,
		get() {
			return this.issues.length === 0;
		}
	});
};
var ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, void 0, { Parent: Error });
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/parse.js
var parse = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
	if (!globalConfig.localeError) config(en_default());
}
function _ensureDefaultMemoizer() {
	if (!globalConfig.memoizer) config({ memoizer: memoizer() });
}
var ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
	_ensureDefaultLocale();
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
	return inst;
}, {
	check(...chks) {
		const def = this.def;
		return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	},
	with(...chks) {
		return this.check(...chks);
	},
	clone(def, params) {
		return clone(this, def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta) {
		reg.add(this, meta);
		return this;
	},
	refine(check, params) {
		return this.check(refine(check, params));
	},
	superRefine(refinement, params) {
		return this.check(superRefine(refinement, params));
	},
	overwrite(fn) {
		return this.check(/* @__PURE__ */ _overwrite(fn));
	},
	optional() {
		return optional(this);
	},
	exactOptional() {
		return exactOptional(this);
	},
	nullable() {
		return nullable(this);
	},
	nullish() {
		return optional(nullable(this));
	},
	nonoptional(params) {
		return nonoptional(this, params);
	},
	array() {
		return array(this);
	},
	or(arg) {
		return union([this, arg]);
	},
	and(arg) {
		return intersection(this, arg);
	},
	transform(tx) {
		return pipe(this, transform(tx));
	},
	default(d) {
		return _default(this, d);
	},
	prefault(d) {
		return prefault(this, d);
	},
	catch(params) {
		return _catch(this, params);
	},
	pipe(target) {
		return pipe(this, target);
	},
	readonly() {
		return readonly(this);
	},
	describe(description) {
		const cl = this.clone();
		globalRegistry.add(cl, { description });
		return cl;
	},
	meta(...args) {
		if (args.length === 0) return globalRegistry.get(this);
		const cl = this.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	},
	get "~standard"() {
		return hide(this, "~standard", {
			...standardProps(this),
			jsonSchema: {
				input: createStandardJSONSchemaMethod(this, "input"),
				output: createStandardJSONSchemaMethod(this, "output")
			}
		});
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	},
	parse: function _parse(data, params) {
		return parse(this, data, params, { callee: _parse });
	},
	parseAsync: async function _parseAsync(data, params) {
		return await parseAsync(this, data, params, { callee: _parseAsync });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	async safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(value) {
		own(this, "spa", value);
	},
	validate(data, params) {
		return validate(this, data, params);
	},
	validateAsync(data, params) {
		return validateAsync$1(this, data, params);
	},
	encode: function _encode(data, params) {
		return encode(this, data, params, { callee: _encode });
	},
	decode: function _decode(data, params) {
		return decode(this, data, params, { callee: _decode });
	},
	encodeAsync: async function _encodeAsync(data, params) {
		return await encodeAsync(this, data, params, { callee: _encodeAsync });
	},
	decodeAsync: async function _decodeAsync(data, params) {
		return await decodeAsync(this, data, params, { callee: _decodeAsync });
	},
	safeEncode(data, params) {
		return safeEncode(this, data, params);
	},
	safeDecode(data, params) {
		return safeDecode(this, data, params);
	},
	async safeEncodeAsync(data, params) {
		return safeEncodeAsync(this, data, params);
	},
	async safeDecodeAsync(data, params) {
		return safeDecodeAsync(this, data, params);
	},
	toJSONSchema(params) {
		return createToJSONSchemaMethod(this, {})(params);
	},
	get description() {
		return globalRegistry.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
});
/** @internal */
var _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
	format: (inst) => aggregateChecks(inst).format ?? null,
	minLength: (inst) => aggregateChecks(inst).minimum ?? null,
	maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
	regex(...args) {
		return this.check(/* @__PURE__ */ _regex(...args));
	},
	includes(...args) {
		return this.check(/* @__PURE__ */ _includes(...args));
	},
	startsWith(...args) {
		return this.check(/* @__PURE__ */ _startsWith(...args));
	},
	endsWith(...args) {
		return this.check(/* @__PURE__ */ _endsWith(...args));
	},
	min(...args) {
		return this.check(/* @__PURE__ */ _minLength(...args));
	},
	max(...args) {
		return this.check(/* @__PURE__ */ _maxLength(...args));
	},
	length(...args) {
		return this.check(/* @__PURE__ */ _length(...args));
	},
	nonempty(...args) {
		return this.check(/* @__PURE__ */ _minLength(1, ...args));
	},
	lowercase(params) {
		return this.check(/* @__PURE__ */ _lowercase(params));
	},
	uppercase(params) {
		return this.check(/* @__PURE__ */ _uppercase(params));
	},
	trim() {
		return this.check(/* @__PURE__ */ _trim());
	},
	normalize(...args) {
		return this.check(/* @__PURE__ */ _normalize(...args));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ _toLowerCase());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ _toUpperCase());
	},
	slugify() {
		return this.check(/* @__PURE__ */ _slugify());
	}
}));
var ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
}, {
	email(params) {
		return this.check(/* @__PURE__ */ _email(ZodEmail, params));
	},
	url(params) {
		return this.check(/* @__PURE__ */ _url(ZodURL, params));
	},
	jwt(params) {
		return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	},
	emoji(params) {
		return this.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	},
	guid(params) {
		return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
	},
	uuid(params) {
		return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	},
	uuidv4(params) {
		return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	},
	uuidv6(params) {
		return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	},
	uuidv7(params) {
		return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	},
	nanoid(params) {
		return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	},
	cuid(params) {
		return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	},
	cuid2(params) {
		return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	},
	ulid(params) {
		return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
	},
	base64(params) {
		return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
	},
	base64url(params) {
		return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	},
	xid(params) {
		return this.check(/* @__PURE__ */ _xid(ZodXID, params));
	},
	ksuid(params) {
		return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	},
	ipv4(params) {
		return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	},
	ipv6(params) {
		return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	},
	cidrv4(params) {
		return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	},
	cidrv6(params) {
		return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	},
	e164(params) {
		return this.check(/* @__PURE__ */ _e164(ZodE164, params));
	},
	datetime(params) {
		return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
	},
	date(params) {
		return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
	},
	time(params) {
		return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
	},
	duration(params) {
		return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
	}
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
var ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
var ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.isFinite = true;
}, /*@__PURE__*/ derived({
	minValue: (inst) => {
		const { minimum, exclusiveMinimum } = aggregateChecks(inst);
		return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
	},
	maxValue: (inst) => {
		const { maximum, exclusiveMaximum } = aggregateChecks(inst);
		return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
	},
	isInt: (inst) => {
		const { isInt, multipleOf } = aggregateChecks(inst);
		return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
	},
	format: (inst) => aggregateChecks(inst).format ?? null
}, {
	gt(value, params) {
		return this.check(/* @__PURE__ */ _gt(value, params));
	},
	gte(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	min(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	lt(value, params) {
		return this.check(/* @__PURE__ */ _lt(value, params));
	},
	lte(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	max(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	int(params) {
		return this.check(int(params));
	},
	safe(params) {
		return this.check(int(params));
	},
	positive(params) {
		return this.check(/* @__PURE__ */ _gt(0, params));
	},
	nonnegative(params) {
		return this.check(/* @__PURE__ */ _gte(0, params));
	},
	negative(params) {
		return this.check(/* @__PURE__ */ _lt(0, params));
	},
	nonpositive(params) {
		return this.check(/* @__PURE__ */ _lte(0, params));
	},
	multipleOf(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	step(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	finite() {
		return this;
	}
}));
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
var ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
var ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
var ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => void 0;
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
var ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
var ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
}, {
	min(n, params) {
		return this.check(/* @__PURE__ */ _minLength(n, params));
	},
	nonempty(params) {
		return this.check(/* @__PURE__ */ _minLength(1, params));
	},
	max(n, params) {
		return this.check(/* @__PURE__ */ _maxLength(n, params));
	},
	length(n, params) {
		return this.check(/* @__PURE__ */ _length(n, params));
	},
	unwrap() {
		return this.element;
	}
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
var ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
	keyof() {
		return _enum(Object.keys(this._zod.def.shape));
	},
	catchall(catchall) {
		return this.clone(mergeDefs(this._zod.def, { catchall }));
	},
	passthrough() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	loose() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	strict() {
		return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
	},
	strip() {
		return this.clone(mergeDefs(this._zod.def, { catchall: void 0 }));
	},
	extend(incoming) {
		return extend(this, incoming);
	},
	safeExtend(incoming) {
		return safeExtend(this, incoming);
	},
	merge(other) {
		return merge(this, other);
	},
	pick(mask) {
		return pick(this, mask);
	},
	omit(mask) {
		return omit(this, mask);
	},
	partial(...args) {
		return partial(ZodOptional, this, args[0]);
	},
	exactPartial(...args) {
		return partial(ZodExactOptional, this, args[0], "exactPartial");
	},
	required(...args) {
		return required(ZodNonOptional, this, args[0]);
	}
});
function object(shape, params) {
	return new ZodObject({
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	});
}
var ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
var ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
var ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = [...inst._zod.values];
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	return new ZodEnum({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
var ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
var ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
var ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
var ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
var ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
var ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
var ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
	});
}
var ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
var ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
var ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
// src/schemas/device.ts
/**
* The shape of one device in the catalog. Adding a phone = adding one object
* that matches this schema to the right file in src/devices/catalog/.
*
* All sizes are CSS pixels (what a website sees), in PORTRAIT orientation.
* Frames are drawn from these numbers with CSS; no device images are used.
*/
/** What sits at the top of the screen. */
var cutoutSchema = _enum([
	"dynamic-island",
	"notch",
	"punch-hole-center",
	"punch-hole-left",
	"waterdrop",
	"home-button",
	"none"
]);
/** Side-button arrangement; when left out it is derived from brand / platform / kind. */
var buttonLayoutSchema = _enum([
	"iphone-switch",
	"iphone-action",
	"iphone-camera-control",
	"samsung",
	"pixel",
	"android",
	"tablet"
]);
var platformSchema = _enum([
	"ios",
	"ipados",
	"android"
]);
var deviceKindSchema = _enum([
	"phone",
	"tablet",
	"foldable"
]);
/** One real colour option of a device, e.g. { name: "Desert Titanium", color: "#bfae98" }. */
var finishSchema = object({
	name: string().min(1).max(40),
	color: string().min(1)
});
var deviceSchema = object({
	/** Stable, unique, kebab-case. Used in URLs and saved settings: never rename. */
	id: string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case only"),
	/** Shown in the picker, e.g. "iPhone 16 Pro". */
	name: string().min(1),
	/** Groups the picker, e.g. "Apple", "Samsung", "Google". */
	brand: string().min(1),
	kind: deviceKindSchema,
	/** Release year, used to sort newest first. */
	year: number().int().min(2007).max(2100),
	platform: platformSchema,
	/** OS version used to build the User-Agent, e.g. "18.0" (iOS) or "14" (Android). */
	osVersion: string().min(1),
	/** Screen size in CSS px, portrait. */
	screen: object({
		width: number().int().positive(),
		height: number().int().positive()
	}),
	/** Device pixel ratio (shown as info; the browser cannot fake it for a frame). */
	dpr: number().positive(),
	frame: object({
		cutout: cutoutSchema,
		/** Corner radius of the screen glass, CSS px. 0 for square screens. */
		screenRadius: number().nonnegative(),
		/** Bezel thickness around the screen, CSS px. */
		bezel: number().nonnegative(),
		/** Body colour (any CSS colour). */
		color: string().min(1).default("#1d1d1f"),
		/** Foldables: draw the fold crease down the middle of the inner screen. */
		crease: boolean().default(false),
		/**
		* Optional real colour options for the finish picker. The first entry
		* should match `color`. Leave out for devices without a picker.
		*/
		finishes: array(finishSchema).min(1).optional(),
		/** Metal band profile: "flat" (iPhone 12+, Galaxy S24 Ultra) or "rounded" (iPhone X/11, Pixel 8). Default "rounded". */
		edge: _enum(["flat", "rounded"]).optional(),
		/** Visible metal rim width from the front, CSS px (part of `bezel`). Default depends on the device kind. */
		rim: number().nonnegative().optional(),
		/** Extra bottom bezel, CSS px (e.g. Pixel chin). Default 0. */
		chin: number().nonnegative().optional(),
		/** Plastic antenna lines across the rim (iPhones, Pixels). Default false. */
		antennaBands: boolean().optional(),
		buttons: buttonLayoutSchema.optional(),
		/** Foldables: hinge on the left edge (folded cover screen) or across the middle (inner screen). */
		hinge: _enum(["left", "center"]).optional()
	}),
	/**
	* true when the numbers are best-known estimates rather than confirmed specs.
	* The picker marks these with "≈" so it is clear they are approximate.
	*/
	approx: boolean().default(false),
	/** Exact User-Agent to send. Leave empty to build one from platform + osVersion. */
	userAgent: string().min(1).optional()
});
// src/devices/catalog/apple.ts
/**
* Apple iPhones and iPads. Sizes are CSS viewport pixels in portrait.
* iPadOS Safari presents itself as a Mac, which the User-Agent builder handles
* from `platform: "ipados"`.
*/
var appleDevices = [
	{
		id: "iphone-17-pro-max",
		name: "iPhone 17 Pro Max",
		brand: "Apple",
		kind: "phone",
		year: 2025,
		platform: "ios",
		osVersion: "26.0",
		screen: {
			width: 440,
			height: 956
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 62,
			bezel: 13,
			color: "#d9773b",
			finishes: [
				{
					name: "Cosmic Orange",
					color: "#d9773b"
				},
				{
					name: "Deep Blue",
					color: "#34435c"
				},
				{
					name: "Deep Burgundy",
					color: "#6d2d3e"
				},
				{
					name: "Silver",
					color: "#d8d8d5"
				}
			],
			edge: "flat",
			rim: 4.5,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-17-pro",
		name: "iPhone 17 Pro",
		brand: "Apple",
		kind: "phone",
		year: 2025,
		platform: "ios",
		osVersion: "26.0",
		screen: {
			width: 402,
			height: 874
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 62,
			bezel: 13,
			color: "#34435c",
			finishes: [
				{
					name: "Deep Blue",
					color: "#34435c"
				},
				{
					name: "Deep Burgundy",
					color: "#6d2d3e"
				},
				{
					name: "Cosmic Orange",
					color: "#d9773b"
				},
				{
					name: "Silver",
					color: "#d8d8d5"
				}
			],
			edge: "flat",
			rim: 4.5,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-air",
		name: "iPhone Air",
		brand: "Apple",
		kind: "phone",
		year: 2025,
		platform: "ios",
		osVersion: "26.0",
		screen: {
			width: 420,
			height: 912
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 62,
			bezel: 13,
			color: "#dcdad5",
			finishes: [
				{
					name: "Cloud White",
					color: "#dcdad5"
				},
				{
					name: "Sky Blue",
					color: "#c6d8e8"
				},
				{
					name: "Light Gold",
					color: "#e6d9bb"
				},
				{
					name: "Space Black",
					color: "#2a2a2c"
				}
			],
			edge: "flat",
			rim: 4,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-17",
		name: "iPhone 17",
		brand: "Apple",
		kind: "phone",
		year: 2025,
		platform: "ios",
		osVersion: "26.0",
		screen: {
			width: 402,
			height: 874
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 62,
			bezel: 13,
			color: "#b4a3c8",
			finishes: [
				{
					name: "Lavender",
					color: "#b4a3c8"
				},
				{
					name: "Sage",
					color: "#a9b79e"
				},
				{
					name: "Mist Blue",
					color: "#a8bccd"
				},
				{
					name: "White",
					color: "#eeeeec"
				},
				{
					name: "Black",
					color: "#2b2b2d"
				}
			],
			edge: "flat",
			rim: 4,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-16e",
		name: "iPhone 16e",
		brand: "Apple",
		kind: "phone",
		year: 2025,
		platform: "ios",
		osVersion: "18.3",
		screen: {
			width: 390,
			height: 844
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#1f1f21",
			finishes: [{
				name: "Black",
				color: "#1f1f21"
			}, {
				name: "White",
				color: "#eeeeec"
			}],
			edge: "flat",
			rim: 4,
			antennaBands: true,
			buttons: "iphone-action"
		}
	},
	{
		id: "iphone-16-pro-max",
		name: "iPhone 16 Pro Max",
		brand: "Apple",
		kind: "phone",
		year: 2024,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 440,
			height: 956
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 62,
			bezel: 13,
			color: "#bfae98",
			finishes: [
				{
					name: "Desert Titanium",
					color: "#bfae98"
				},
				{
					name: "Natural Titanium",
					color: "#8f8a81"
				},
				{
					name: "Deep Burgundy",
					color: "#6d2d3e"
				},
				{
					name: "White Titanium",
					color: "#e3e1dc"
				},
				{
					name: "Black Titanium",
					color: "#3c3c3e"
				}
			],
			edge: "flat",
			rim: 4.5,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-16-pro",
		name: "iPhone 16 Pro",
		brand: "Apple",
		kind: "phone",
		year: 2024,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 402,
			height: 874
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 62,
			bezel: 13,
			color: "#8f8a81",
			finishes: [
				{
					name: "Natural Titanium",
					color: "#8f8a81"
				},
				{
					name: "Deep Burgundy",
					color: "#6d2d3e"
				},
				{
					name: "Desert Titanium",
					color: "#bfae98"
				},
				{
					name: "White Titanium",
					color: "#e3e1dc"
				},
				{
					name: "Black Titanium",
					color: "#3c3c3e"
				}
			],
			edge: "flat",
			rim: 4.5,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-16-plus",
		name: "iPhone 16 Plus",
		brand: "Apple",
		kind: "phone",
		year: 2024,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 430,
			height: 932
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 15,
			color: "#7d97cf",
			finishes: [
				{
					name: "Ultramarine",
					color: "#7d97cf"
				},
				{
					name: "Teal",
					color: "#8bb5a5"
				},
				{
					name: "Pink",
					color: "#e9b8cf"
				},
				{
					name: "White",
					color: "#eeeeec"
				},
				{
					name: "Black",
					color: "#2b2b2d"
				}
			],
			edge: "flat",
			rim: 4,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-16",
		name: "iPhone 16",
		brand: "Apple",
		kind: "phone",
		year: 2024,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 393,
			height: 852
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 15,
			color: "#8bb5a5",
			finishes: [
				{
					name: "Teal",
					color: "#8bb5a5"
				},
				{
					name: "Ultramarine",
					color: "#7d97cf"
				},
				{
					name: "Pink",
					color: "#e9b8cf"
				},
				{
					name: "White",
					color: "#eeeeec"
				},
				{
					name: "Black",
					color: "#2b2b2d"
				}
			],
			edge: "flat",
			rim: 4,
			antennaBands: true,
			buttons: "iphone-camera-control"
		}
	},
	{
		id: "iphone-15-pro-max",
		name: "iPhone 15 Pro Max",
		brand: "Apple",
		kind: "phone",
		year: 2023,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 430,
			height: 932
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 14,
			color: "#3b3f4a",
			finishes: [
				{
					name: "Blue Titanium",
					color: "#3b3f4a"
				},
				{
					name: "Natural Titanium",
					color: "#8f8a81"
				},
				{
					name: "White Titanium",
					color: "#e3e1dc"
				},
				{
					name: "Black Titanium",
					color: "#3c3c3e"
				}
			],
			edge: "rounded",
			rim: 4.5,
			antennaBands: true,
			buttons: "iphone-action"
		}
	},
	{
		id: "iphone-15-pro",
		name: "iPhone 15 Pro",
		brand: "Apple",
		kind: "phone",
		year: 2023,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 393,
			height: 852
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 14,
			color: "#8f8a81",
			finishes: [
				{
					name: "Natural Titanium",
					color: "#8f8a81"
				},
				{
					name: "Blue Titanium",
					color: "#3b3f4a"
				},
				{
					name: "White Titanium",
					color: "#e3e1dc"
				},
				{
					name: "Black Titanium",
					color: "#3c3c3e"
				}
			],
			edge: "rounded",
			rim: 4.5,
			antennaBands: true,
			buttons: "iphone-action"
		}
	},
	{
		id: "iphone-15-plus",
		name: "iPhone 15 Plus",
		brand: "Apple",
		kind: "phone",
		year: 2023,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 430,
			height: 932
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 15,
			color: "#eecfd2",
			finishes: [
				{
					name: "Pink",
					color: "#eecfd2"
				},
				{
					name: "Yellow",
					color: "#ece3a8"
				},
				{
					name: "Green",
					color: "#cfdfd0"
				},
				{
					name: "Blue",
					color: "#c9d8e4"
				},
				{
					name: "Black",
					color: "#3a3b3d"
				}
			],
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-15",
		name: "iPhone 15",
		brand: "Apple",
		kind: "phone",
		year: 2023,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 393,
			height: 852
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 15,
			color: "#cfdfd0",
			finishes: [
				{
					name: "Green",
					color: "#cfdfd0"
				},
				{
					name: "Pink",
					color: "#eecfd2"
				},
				{
					name: "Yellow",
					color: "#ece3a8"
				},
				{
					name: "Blue",
					color: "#c9d8e4"
				},
				{
					name: "Black",
					color: "#3a3b3d"
				}
			],
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-14-pro-max",
		name: "iPhone 14 Pro Max",
		brand: "Apple",
		kind: "phone",
		year: 2022,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 430,
			height: 932
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 15,
			color: "#544c61",
			finishes: [
				{
					name: "Deep Purple",
					color: "#544c61"
				},
				{
					name: "Space Black",
					color: "#2f2e33"
				},
				{
					name: "Silver",
					color: "#e3e3e0"
				},
				{
					name: "Gold",
					color: "#e9d9b8"
				}
			],
			edge: "flat",
			rim: 4.5,
			antennaBands: true
		}
	},
	{
		id: "iphone-14-pro",
		name: "iPhone 14 Pro",
		brand: "Apple",
		kind: "phone",
		year: 2022,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 393,
			height: 852
		},
		dpr: 3,
		frame: {
			cutout: "dynamic-island",
			screenRadius: 55,
			bezel: 15,
			color: "#2f2e33",
			finishes: [
				{
					name: "Space Black",
					color: "#2f2e33"
				},
				{
					name: "Deep Purple",
					color: "#544c61"
				},
				{
					name: "Silver",
					color: "#e3e3e0"
				},
				{
					name: "Gold",
					color: "#e9d9b8"
				}
			],
			edge: "flat",
			rim: 4.5,
			antennaBands: true
		}
	},
	{
		id: "iphone-14-plus",
		name: "iPhone 14 Plus",
		brand: "Apple",
		kind: "phone",
		year: 2022,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 428,
			height: 926
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#a6bdd4",
			edge: "flat",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-14",
		name: "iPhone 14",
		brand: "Apple",
		kind: "phone",
		year: 2022,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 390,
			height: 844
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#c5b8d4",
			edge: "flat",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-se-3",
		name: "iPhone SE (3rd gen)",
		brand: "Apple",
		kind: "phone",
		year: 2022,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 375,
			height: 667
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 18,
			color: "#1c1c1e",
			edge: "rounded",
			rim: 3
		}
	},
	{
		id: "iphone-13-pro-max",
		name: "iPhone 13 Pro Max",
		brand: "Apple",
		kind: "phone",
		year: 2021,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 428,
			height: 926
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#a5bfcf",
			edge: "flat",
			rim: 4.5,
			antennaBands: true
		}
	},
	{
		id: "iphone-13-pro",
		name: "iPhone 13 Pro",
		brand: "Apple",
		kind: "phone",
		year: 2021,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 390,
			height: 844
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#56695a",
			edge: "flat",
			rim: 4.5,
			antennaBands: true
		}
	},
	{
		id: "iphone-13",
		name: "iPhone 13",
		brand: "Apple",
		kind: "phone",
		year: 2021,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 390,
			height: 844
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#28354a",
			finishes: [
				{
					name: "Midnight",
					color: "#28354a"
				},
				{
					name: "Starlight",
					color: "#ece6dc"
				},
				{
					name: "Blue",
					color: "#3f6489"
				},
				{
					name: "Pink",
					color: "#efcdcc"
				},
				{
					name: "Product Red",
					color: "#b3242a"
				}
			],
			edge: "flat",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-13-mini",
		name: "iPhone 13 mini",
		brand: "Apple",
		kind: "phone",
		year: 2021,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 375,
			height: 812
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 44,
			bezel: 17,
			color: "#efcdcc",
			edge: "flat",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-12-pro-max",
		name: "iPhone 12 Pro Max",
		brand: "Apple",
		kind: "phone",
		year: 2020,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 428,
			height: 926
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#384b5f",
			edge: "flat",
			rim: 4.5,
			antennaBands: true
		}
	},
	{
		id: "iphone-12-pro",
		name: "iPhone 12 Pro",
		brand: "Apple",
		kind: "phone",
		year: 2020,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 390,
			height: 844
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#e3ddd2",
			edge: "flat",
			rim: 4.5,
			antennaBands: true
		}
	},
	{
		id: "iphone-12",
		name: "iPhone 12",
		brand: "Apple",
		kind: "phone",
		year: 2020,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 390,
			height: 844
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 47,
			bezel: 17,
			color: "#2b4a6f",
			edge: "flat",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-12-mini",
		name: "iPhone 12 mini",
		brand: "Apple",
		kind: "phone",
		year: 2020,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 375,
			height: 812
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 44,
			bezel: 17,
			color: "#e4e4e4",
			edge: "flat",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-se-2",
		name: "iPhone SE (2nd gen)",
		brand: "Apple",
		kind: "phone",
		year: 2020,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 375,
			height: 667
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 18,
			color: "#1c1c1e",
			edge: "rounded",
			rim: 3
		}
	},
	{
		id: "iphone-11-pro-max",
		name: "iPhone 11 Pro Max",
		brand: "Apple",
		kind: "phone",
		year: 2019,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 414,
			height: 896
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 39,
			bezel: 20,
			color: "#4a5a4c",
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-11-pro",
		name: "iPhone 11 Pro",
		brand: "Apple",
		kind: "phone",
		year: 2019,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 375,
			height: 812
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 39,
			bezel: 20,
			color: "#e2cfb0",
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-11",
		name: "iPhone 11",
		brand: "Apple",
		kind: "phone",
		year: 2019,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 414,
			height: 896
		},
		dpr: 2,
		frame: {
			cutout: "notch",
			screenRadius: 41,
			bezel: 24,
			color: "#b6a6d0",
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-xs-max",
		name: "iPhone XS Max",
		brand: "Apple",
		kind: "phone",
		year: 2018,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 414,
			height: 896
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 39,
			bezel: 20,
			color: "#e0c6a0",
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-xs",
		name: "iPhone XS",
		brand: "Apple",
		kind: "phone",
		year: 2018,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 375,
			height: 812
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 39,
			bezel: 20,
			color: "#2b2b2d",
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-xr",
		name: "iPhone XR",
		brand: "Apple",
		kind: "phone",
		year: 2018,
		platform: "ios",
		osVersion: "18.0",
		screen: {
			width: 414,
			height: 896
		},
		dpr: 2,
		frame: {
			cutout: "notch",
			screenRadius: 41,
			bezel: 24,
			color: "#b3242a",
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-x",
		name: "iPhone X",
		brand: "Apple",
		kind: "phone",
		year: 2017,
		platform: "ios",
		osVersion: "16.7",
		screen: {
			width: 375,
			height: 812
		},
		dpr: 3,
		frame: {
			cutout: "notch",
			screenRadius: 39,
			bezel: 20,
			color: "#2b2b2d",
			edge: "rounded",
			rim: 4,
			antennaBands: true
		}
	},
	{
		id: "iphone-8-plus",
		name: "iPhone 8 Plus",
		brand: "Apple",
		kind: "phone",
		year: 2017,
		platform: "ios",
		osVersion: "16.7",
		screen: {
			width: 414,
			height: 736
		},
		dpr: 3,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 20,
			color: "#f1efeb",
			edge: "rounded",
			rim: 3
		}
	},
	{
		id: "iphone-8",
		name: "iPhone 8",
		brand: "Apple",
		kind: "phone",
		year: 2017,
		platform: "ios",
		osVersion: "16.7",
		screen: {
			width: 375,
			height: 667
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 18,
			color: "#f1efeb",
			edge: "rounded",
			rim: 3
		}
	},
	{
		id: "iphone-7-plus",
		name: "iPhone 7 Plus",
		brand: "Apple",
		kind: "phone",
		year: 2016,
		platform: "ios",
		osVersion: "15.8",
		screen: {
			width: 414,
			height: 736
		},
		dpr: 3,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 20,
			color: "#1c1c1e",
			edge: "rounded",
			rim: 3
		}
	},
	{
		id: "iphone-7",
		name: "iPhone 7",
		brand: "Apple",
		kind: "phone",
		year: 2016,
		platform: "ios",
		osVersion: "15.8",
		screen: {
			width: 375,
			height: 667
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 18,
			color: "#1c1c1e",
			edge: "rounded",
			rim: 3
		}
	},
	{
		id: "iphone-se-1",
		name: "iPhone SE (1st gen)",
		brand: "Apple",
		kind: "phone",
		year: 2016,
		platform: "ios",
		osVersion: "15.8",
		screen: {
			width: 320,
			height: 568
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 16,
			color: "#f1efeb",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-pro-13-m5",
		name: "iPad Pro 13\" (M5)",
		brand: "Apple",
		kind: "tablet",
		year: 2025,
		platform: "ipados",
		osVersion: "26.0",
		screen: {
			width: 1032,
			height: 1376
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 20,
			color: "#2c2c2e",
			finishes: [{
				name: "Space Black",
				color: "#2c2c2e"
			}, {
				name: "Silver",
				color: "#c9c9cb"
			}],
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "ipad-pro-11-m5",
		name: "iPad Pro 11\" (M5)",
		brand: "Apple",
		kind: "tablet",
		year: 2025,
		platform: "ipados",
		osVersion: "26.0",
		screen: {
			width: 834,
			height: 1210
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 20,
			color: "#c9c9cb",
			finishes: [{
				name: "Silver",
				color: "#c9c9cb"
			}, {
				name: "Space Black",
				color: "#2c2c2e"
			}],
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "ipad-pro-13-m4",
		name: "iPad Pro 13\" (M4)",
		brand: "Apple",
		kind: "tablet",
		year: 2024,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 1032,
			height: 1376
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 20,
			color: "#2c2c2e",
			finishes: [{
				name: "Space Black",
				color: "#2c2c2e"
			}, {
				name: "Silver",
				color: "#c9c9cb"
			}],
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-pro-11-m4",
		name: "iPad Pro 11\" (M4)",
		brand: "Apple",
		kind: "tablet",
		year: 2024,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 834,
			height: 1210
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 20,
			color: "#c9c9cb",
			finishes: [{
				name: "Silver",
				color: "#c9c9cb"
			}, {
				name: "Space Black",
				color: "#2c2c2e"
			}],
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-pro-12-9",
		name: "iPad Pro 12.9\"",
		brand: "Apple",
		kind: "tablet",
		year: 2022,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 1024,
			height: 1366
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 24,
			color: "#3a3a3c",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-pro-11",
		name: "iPad Pro 11\"",
		brand: "Apple",
		kind: "tablet",
		year: 2022,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 834,
			height: 1194
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 24,
			color: "#c9c9cb",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-pro-10-5",
		name: "iPad Pro 10.5\"",
		brand: "Apple",
		kind: "tablet",
		year: 2017,
		platform: "ipados",
		osVersion: "17.0",
		screen: {
			width: 834,
			height: 1112
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 34,
			color: "#1c1c1e"
		}
	},
	{
		id: "ipad-air-13-m3",
		name: "iPad Air 13\" (M3)",
		brand: "Apple",
		kind: "tablet",
		year: 2025,
		platform: "ipados",
		osVersion: "18.3",
		screen: {
			width: 1024,
			height: 1366
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 24,
			color: "#a7a2c2",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-air-11-m3",
		name: "iPad Air 11\" (M3)",
		brand: "Apple",
		kind: "tablet",
		year: 2025,
		platform: "ipados",
		osVersion: "18.3",
		screen: {
			width: 820,
			height: 1180
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 24,
			color: "#9bb3cf",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-air-13-m2",
		name: "iPad Air 13\" (M2)",
		brand: "Apple",
		kind: "tablet",
		year: 2024,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 1024,
			height: 1366
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 24,
			color: "#3a3a3c",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-air-11-m2",
		name: "iPad Air 11\" (M2)",
		brand: "Apple",
		kind: "tablet",
		year: 2024,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 820,
			height: 1180
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 24,
			color: "#e6dcc8",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-air-5",
		name: "iPad Air (5th gen)",
		brand: "Apple",
		kind: "tablet",
		year: 2022,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 820,
			height: 1180
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 24,
			color: "#8fa6c6",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-a16",
		name: "iPad (A16)",
		brand: "Apple",
		kind: "tablet",
		year: 2025,
		platform: "ipados",
		osVersion: "18.3",
		screen: {
			width: 820,
			height: 1180
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 26,
			color: "#e9d36f",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-10",
		name: "iPad (10th gen)",
		brand: "Apple",
		kind: "tablet",
		year: 2022,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 820,
			height: 1180
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 26,
			color: "#7aa3c9",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-9",
		name: "iPad 10.2\" (9th gen)",
		brand: "Apple",
		kind: "tablet",
		year: 2021,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 810,
			height: 1080
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 40,
			color: "#1c1c1e"
		}
	},
	{
		id: "ipad-mini-a17-pro",
		name: "iPad mini (A17 Pro)",
		brand: "Apple",
		kind: "tablet",
		year: 2024,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 744,
			height: 1133
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 21,
			bezel: 22,
			color: "#b8b2d4",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-mini-6",
		name: "iPad mini (6th gen)",
		brand: "Apple",
		kind: "tablet",
		year: 2021,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 744,
			height: 1133
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 21,
			bezel: 22,
			color: "#3a3a3c",
			edge: "flat",
			rim: 3
		}
	},
	{
		id: "ipad-mini-5",
		name: "iPad mini (5th gen)",
		brand: "Apple",
		kind: "tablet",
		year: 2019,
		platform: "ipados",
		osVersion: "18.0",
		screen: {
			width: 768,
			height: 1024
		},
		dpr: 2,
		frame: {
			cutout: "home-button",
			screenRadius: 0,
			bezel: 40,
			color: "#f1efeb"
		}
	}
];
// src/devices/catalog/google.ts
/**
* Google Pixel, Nexus and Nest devices. Sizes are CSS viewport pixels in
* portrait. Devices whose screen is natively landscape (Nest Hub, the inner
* Pixel Fold screen) are stored portrait; rotate them in the simulator.
*/
var googleDevices = [
	{
		id: "pixel-10-pro-fold",
		name: "Pixel 10 Pro Fold (folded)",
		brand: "Google",
		kind: "foldable",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 412,
			height: 900
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 11,
			color: "#4b5563",
			edge: "flat",
			rim: 3,
			hinge: "left"
		},
		approx: true
	},
	{
		id: "pixel-10-pro-fold-unfolded",
		name: "Pixel 10 Pro Fold (unfolded)",
		brand: "Google",
		kind: "foldable",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 791,
			height: 820
		},
		dpr: 2.625,
		frame: {
			cutout: "none",
			screenRadius: 20,
			bezel: 12,
			color: "#4b5563",
			crease: true,
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "pixel-10-pro-xl",
		name: "Pixel 10 Pro XL",
		brand: "Google",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 448,
			height: 998
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 34,
			bezel: 10,
			color: "#cfd6cf",
			finishes: [
				{
					name: "Jade",
					color: "#cfd6cf"
				},
				{
					name: "Obsidian",
					color: "#2f3133"
				},
				{
					name: "Moonstone",
					color: "#8d96a3"
				},
				{
					name: "Porcelain",
					color: "#ece4d8"
				}
			],
			edge: "flat",
			rim: 3.5,
			chin: 2,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-10-pro",
		name: "Pixel 10 Pro",
		brand: "Google",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 410,
			height: 914
		},
		dpr: 3.125,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 34,
			bezel: 10,
			color: "#2f3a4a",
			finishes: [
				{
					name: "Obsidian",
					color: "#2f3a4a"
				},
				{
					name: "Moonstone",
					color: "#8d96a3"
				},
				{
					name: "Porcelain",
					color: "#ece4d8"
				},
				{
					name: "Jade",
					color: "#c7d9c4"
				}
			],
			edge: "flat",
			rim: 3.5,
			chin: 2,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-10",
		name: "Pixel 10",
		brand: "Google",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 412,
			height: 923
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 34,
			bezel: 11,
			color: "#7e86c7",
			edge: "flat",
			rim: 3.5,
			chin: 2,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-9a",
		name: "Pixel 9a",
		brand: "Google",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 923
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 13,
			color: "#c8b8e8",
			edge: "flat",
			rim: 3.5,
			chin: 2,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-9-pro-fold",
		name: "Pixel 9 Pro Fold (folded)",
		brand: "Google",
		kind: "foldable",
		year: 2024,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 923
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 11,
			color: "#dedbd5",
			edge: "flat",
			rim: 3,
			hinge: "left"
		},
		approx: true
	},
	{
		id: "pixel-9-pro-fold-unfolded",
		name: "Pixel 9 Pro Fold (unfolded)",
		brand: "Google",
		kind: "foldable",
		year: 2024,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 791,
			height: 820
		},
		dpr: 2.625,
		frame: {
			cutout: "none",
			screenRadius: 20,
			bezel: 12,
			color: "#dedbd5",
			crease: true,
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "pixel-9-pro-xl",
		name: "Pixel 9 Pro XL",
		brand: "Google",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 448,
			height: 998
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 34,
			bezel: 10,
			color: "#e8d9c9",
			finishes: [
				{
					name: "Porcelain",
					color: "#e8d9c9"
				},
				{
					name: "Obsidian",
					color: "#3c3f44"
				},
				{
					name: "Hazel",
					color: "#8c917f"
				},
				{
					name: "Rose Quartz",
					color: "#e9c9c6"
				}
			],
			edge: "flat",
			rim: 3.5,
			chin: 2,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-9-pro",
		name: "Pixel 9 Pro",
		brand: "Google",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 410,
			height: 914
		},
		dpr: 3.125,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 34,
			bezel: 10,
			color: "#3c3f44",
			finishes: [
				{
					name: "Obsidian",
					color: "#3c3f44"
				},
				{
					name: "Porcelain",
					color: "#e8d9c9"
				},
				{
					name: "Hazel",
					color: "#8c917f"
				},
				{
					name: "Rose Quartz",
					color: "#e9c9c6"
				}
			],
			edge: "flat",
			rim: 3.5,
			chin: 2,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-9",
		name: "Pixel 9",
		brand: "Google",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 923
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 34,
			bezel: 11,
			color: "#f0c6d4",
			finishes: [
				{
					name: "Peony",
					color: "#f0c6d4"
				},
				{
					name: "Obsidian",
					color: "#2f3133"
				},
				{
					name: "Porcelain",
					color: "#ece4d8"
				},
				{
					name: "Wintergreen",
					color: "#cfe3cf"
				}
			],
			edge: "flat",
			rim: 3.5,
			chin: 2,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-8a",
		name: "Pixel 8a",
		brand: "Google",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 13,
			color: "#a9d4d2",
			edge: "rounded",
			rim: 3.5,
			chin: 3,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-8-pro",
		name: "Pixel 8 Pro",
		brand: "Google",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 448,
			height: 998
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 34,
			bezel: 10,
			color: "#a8c3dc",
			finishes: [
				{
					name: "Bay",
					color: "#a8c3dc"
				},
				{
					name: "Obsidian",
					color: "#2f3133"
				},
				{
					name: "Porcelain",
					color: "#ece4d8"
				}
			],
			edge: "rounded",
			rim: 3.5,
			chin: 3,
			antennaBands: true
		}
	},
	{
		id: "pixel-8",
		name: "Pixel 8",
		brand: "Google",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 32,
			bezel: 11,
			color: "#a9ad9a",
			finishes: [
				{
					name: "Hazel",
					color: "#a9ad9a"
				},
				{
					name: "Obsidian",
					color: "#2f3133"
				},
				{
					name: "Rose",
					color: "#e9d4c2"
				}
			],
			edge: "rounded",
			rim: 3.5,
			chin: 3,
			antennaBands: true
		}
	},
	{
		id: "pixel-fold",
		name: "Pixel Fold (folded)",
		brand: "Google",
		kind: "foldable",
		year: 2023,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 797
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 24,
			bezel: 12,
			color: "#2f3133",
			edge: "flat",
			rim: 3,
			hinge: "left"
		},
		approx: true
	},
	{
		id: "pixel-fold-unfolded",
		name: "Pixel Fold (unfolded)",
		brand: "Google",
		kind: "foldable",
		year: 2023,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 701,
			height: 841
		},
		dpr: 2.625,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 22,
			color: "#2f3133"
		},
		approx: true
	},
	{
		id: "pixel-7a",
		name: "Pixel 7a",
		brand: "Google",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 14,
			color: "#8fb3d9",
			edge: "rounded",
			rim: 3.5,
			chin: 3,
			antennaBands: true
		},
		approx: true
	},
	{
		id: "pixel-7-pro",
		name: "Pixel 7 Pro",
		brand: "Google",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 3.5,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 10,
			color: "#c9cfc4",
			edge: "rounded",
			rim: 3.5,
			chin: 3,
			antennaBands: true
		}
	},
	{
		id: "pixel-7",
		name: "Pixel 7",
		brand: "Google",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 12,
			color: "#d8dcc6",
			edge: "rounded",
			rim: 3.5,
			chin: 3,
			antennaBands: true
		}
	},
	{
		id: "pixel-6a",
		name: "Pixel 6a",
		brand: "Google",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 14,
			color: "#b9c7b3",
			edge: "rounded",
			rim: 3,
			chin: 4
		},
		approx: true
	},
	{
		id: "pixel-6-pro",
		name: "Pixel 6 Pro",
		brand: "Google",
		kind: "phone",
		year: 2021,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 3.5,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 10,
			color: "#f0e6d8",
			edge: "rounded",
			rim: 3,
			chin: 4
		},
		approx: true
	},
	{
		id: "pixel-6",
		name: "Pixel 6",
		brand: "Google",
		kind: "phone",
		year: 2021,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 12,
			color: "#f2b7a2",
			edge: "rounded",
			rim: 3,
			chin: 4
		}
	},
	{
		id: "pixel-5",
		name: "Pixel 5",
		brand: "Google",
		kind: "phone",
		year: 2020,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 393,
			height: 851
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 26,
			bezel: 11,
			color: "#a7b8a3"
		}
	},
	{
		id: "pixel-4a",
		name: "Pixel 4a",
		brand: "Google",
		kind: "phone",
		year: 2020,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 393,
			height: 851
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 24,
			bezel: 12,
			color: "#202124"
		},
		approx: true
	},
	{
		id: "pixel-4",
		name: "Pixel 4",
		brand: "Google",
		kind: "phone",
		year: 2019,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 353,
			height: 745
		},
		dpr: 3,
		frame: {
			cutout: "none",
			screenRadius: 24,
			bezel: 14,
			color: "#f2a65a"
		},
		approx: true
	},
	{
		id: "pixel-3",
		name: "Pixel 3",
		brand: "Google",
		kind: "phone",
		year: 2018,
		platform: "android",
		osVersion: "12",
		screen: {
			width: 393,
			height: 786
		},
		dpr: 2.75,
		frame: {
			cutout: "none",
			screenRadius: 20,
			bezel: 16,
			color: "#f4c7c3"
		},
		approx: true
	},
	{
		id: "nexus-6p",
		name: "Nexus 6P",
		brand: "Google",
		kind: "phone",
		year: 2015,
		platform: "android",
		osVersion: "8",
		screen: {
			width: 412,
			height: 732
		},
		dpr: 3.5,
		frame: {
			cutout: "none",
			screenRadius: 6,
			bezel: 22,
			color: "#c9cbcf"
		}
	},
	{
		id: "nexus-5x",
		name: "Nexus 5X",
		brand: "Google",
		kind: "phone",
		year: 2015,
		platform: "android",
		osVersion: "8",
		screen: {
			width: 412,
			height: 732
		},
		dpr: 2.625,
		frame: {
			cutout: "none",
			screenRadius: 6,
			bezel: 22,
			color: "#1f2326"
		}
	},
	{
		id: "nexus-5",
		name: "Nexus 5",
		brand: "Google",
		kind: "phone",
		year: 2013,
		platform: "android",
		osVersion: "6",
		screen: {
			width: 360,
			height: 640
		},
		dpr: 3,
		frame: {
			cutout: "none",
			screenRadius: 4,
			bezel: 22,
			color: "#1b1b1d"
		}
	},
	{
		id: "nexus-7",
		name: "Nexus 7",
		brand: "Google",
		kind: "tablet",
		year: 2013,
		platform: "android",
		osVersion: "6",
		screen: {
			width: 600,
			height: 960
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 4,
			bezel: 34,
			color: "#1b1b1d"
		}
	},
	{
		id: "nexus-10",
		name: "Nexus 10",
		brand: "Google",
		kind: "tablet",
		year: 2012,
		platform: "android",
		osVersion: "5",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 4,
			bezel: 40,
			color: "#2a2a2c"
		}
	},
	{
		id: "pixel-tablet",
		name: "Pixel Tablet",
		brand: "Google",
		kind: "tablet",
		year: 2023,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 34,
			color: "#ece6dc"
		},
		approx: true
	},
	{
		id: "nest-hub-max",
		name: "Nest Hub Max",
		brand: "Google",
		kind: "tablet",
		year: 2019,
		platform: "android",
		osVersion: "10",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 6,
			bezel: 36,
			color: "#f2f1ee"
		}
	},
	{
		id: "nest-hub",
		name: "Nest Hub",
		brand: "Google",
		kind: "tablet",
		year: 2018,
		platform: "android",
		osVersion: "10",
		screen: {
			width: 600,
			height: 1024
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 6,
			bezel: 30,
			color: "#f2f1ee"
		}
	}
];
// src/devices/catalog/others.ts
/**
* Every other brand: Xiaomi (incl. Redmi and POCO), OnePlus, Motorola, Huawei,
* Nothing, OPPO, vivo, realme, Infinix, Tecno, itel, Microsoft and Amazon.
* Sizes are CSS viewport pixels in portrait; most are derived from the panel
* resolution and typical Android density, so they are marked `approx`.
*/
var otherDevices = [
	{
		id: "xiaomi-15",
		name: "Xiaomi 15",
		brand: "Xiaomi",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 400,
			height: 890
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 9,
			color: "#2b2d31"
		},
		approx: true
	},
	{
		id: "xiaomi-14",
		name: "Xiaomi 14",
		brand: "Xiaomi",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 400,
			height: 890
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 9,
			color: "#cfe0d6"
		},
		approx: true
	},
	{
		id: "xiaomi-13",
		name: "Xiaomi 13",
		brand: "Xiaomi",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 393,
			height: 873
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#e8e6e1"
		},
		approx: true
	},
	{
		id: "redmi-note-14",
		name: "Redmi Note 14",
		brand: "Xiaomi",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 393,
			height: 873
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 12,
			color: "#6b8f7a"
		},
		approx: true
	},
	{
		id: "redmi-note-13",
		name: "Redmi Note 13",
		brand: "Xiaomi",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 393,
			height: 873
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 12,
			color: "#9cc0dd"
		},
		approx: true
	},
	{
		id: "redmi-note-12",
		name: "Redmi Note 12",
		brand: "Xiaomi",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 393,
			height: 873
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 12,
			color: "#2f3c4d"
		},
		approx: true
	},
	{
		id: "redmi-note-11",
		name: "Redmi Note 11",
		brand: "Xiaomi",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 393,
			height: 873
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 24,
			bezel: 12,
			color: "#3b4e7a"
		},
		approx: true
	},
	{
		id: "redmi-13c",
		name: "Redmi 13C",
		brand: "Xiaomi",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 914
		},
		dpr: 1.75,
		frame: {
			cutout: "waterdrop",
			screenRadius: 22,
			bezel: 14,
			color: "#4a6a8a"
		},
		approx: true
	},
	{
		id: "redmi-a3",
		name: "Redmi A3",
		brand: "Xiaomi",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 943
		},
		dpr: 1.75,
		frame: {
			cutout: "waterdrop",
			screenRadius: 22,
			bezel: 14,
			color: "#2a5c4f"
		},
		approx: true
	},
	{
		id: "poco-f6",
		name: "POCO F6",
		brand: "Xiaomi",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 407,
			height: 904
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#1f2124"
		},
		approx: true
	},
	{
		id: "poco-x6-pro",
		name: "POCO X6 Pro",
		brand: "Xiaomi",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 407,
			height: 904
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#e0b100"
		},
		approx: true
	},
	{
		id: "poco-x5-pro",
		name: "POCO X5 Pro",
		brand: "Xiaomi",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 393,
			height: 873
		},
		dpr: 2.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 11,
			color: "#3c6fb0"
		},
		approx: true
	},
	{
		id: "xiaomi-pad-6",
		name: "Xiaomi Pad 6",
		brand: "Xiaomi",
		kind: "tablet",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2.25,
		frame: {
			cutout: "none",
			screenRadius: 16,
			bezel: 24,
			color: "#9fb1c4"
		},
		approx: true
	},
	{
		id: "oneplus-13",
		name: "OnePlus 13",
		brand: "OnePlus",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 905
		},
		dpr: 3.5,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 30,
			bezel: 9,
			color: "#2a3b52"
		},
		approx: true
	},
	{
		id: "oneplus-12",
		name: "OnePlus 12",
		brand: "OnePlus",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 905
		},
		dpr: 3.5,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 30,
			bezel: 9,
			color: "#3f7d64"
		},
		approx: true
	},
	{
		id: "oneplus-11",
		name: "OnePlus 11",
		brand: "OnePlus",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 919
		},
		dpr: 3.5,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 30,
			bezel: 9,
			color: "#2c2d30"
		},
		approx: true
	},
	{
		id: "oneplus-nord-4",
		name: "OnePlus Nord 4",
		brand: "OnePlus",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 924
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 10,
			color: "#9ab0a1"
		},
		approx: true
	},
	{
		id: "oneplus-nord-ce-4",
		name: "OnePlus Nord CE 4",
		brand: "OnePlus",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 919
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 11,
			color: "#5b6e5f"
		},
		approx: true
	},
	{
		id: "oneplus-nord-ce-3-lite",
		name: "OnePlus Nord CE 3 Lite",
		brand: "OnePlus",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 914
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 12,
			color: "#c7e36b"
		},
		approx: true
	},
	{
		id: "oneplus-9",
		name: "OnePlus 9",
		brand: "OnePlus",
		kind: "phone",
		year: 2021,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 914
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 26,
			bezel: 10,
			color: "#a9b8d6"
		},
		approx: true
	},
	{
		id: "moto-edge-50-pro",
		name: "Motorola Edge 50 Pro",
		brand: "Motorola",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.96,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#6a5a8e"
		},
		approx: true
	},
	{
		id: "moto-edge-40",
		name: "Motorola Edge 40",
		brand: "Motorola",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#3a4d5c"
		},
		approx: true
	},
	{
		id: "moto-g84",
		name: "Moto G84",
		brand: "Motorola",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 12,
			color: "#d64f5c"
		},
		approx: true
	},
	{
		id: "moto-g54",
		name: "Moto G54",
		brand: "Motorola",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 24,
			bezel: 13,
			color: "#2c4a66"
		},
		approx: true
	},
	{
		id: "moto-g-power-2022",
		name: "Moto G Power (2022)",
		brand: "Motorola",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "12",
		screen: {
			width: 412,
			height: 823
		},
		dpr: 1.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 22,
			bezel: 14,
			color: "#2e3440"
		}
	},
	{
		id: "moto-g4",
		name: "Moto G4",
		brand: "Motorola",
		kind: "phone",
		year: 2016,
		platform: "android",
		osVersion: "7",
		screen: {
			width: 360,
			height: 640
		},
		dpr: 3,
		frame: {
			cutout: "none",
			screenRadius: 4,
			bezel: 24,
			color: "#1d1d1f"
		}
	},
	{
		id: "huawei-p40-pro",
		name: "Huawei P40 Pro",
		brand: "Huawei",
		kind: "phone",
		year: 2020,
		platform: "android",
		osVersion: "10",
		screen: {
			width: 400,
			height: 880
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 26,
			bezel: 8,
			color: "#c9d6e3"
		},
		approx: true
	},
	{
		id: "huawei-p30-pro",
		name: "Huawei P30 Pro",
		brand: "Huawei",
		kind: "phone",
		year: 2019,
		platform: "android",
		osVersion: "10",
		screen: {
			width: 360,
			height: 780
		},
		dpr: 3,
		frame: {
			cutout: "waterdrop",
			screenRadius: 24,
			bezel: 9,
			color: "#6fa3c9"
		},
		approx: true
	},
	{
		id: "huawei-mate-20-pro",
		name: "Huawei Mate 20 Pro",
		brand: "Huawei",
		kind: "phone",
		year: 2018,
		platform: "android",
		osVersion: "10",
		screen: {
			width: 360,
			height: 780
		},
		dpr: 4,
		frame: {
			cutout: "notch",
			screenRadius: 24,
			bezel: 9,
			color: "#2f5e4e"
		},
		approx: true
	},
	{
		id: "huawei-matepad-11",
		name: "Huawei MatePad 11",
		brand: "Huawei",
		kind: "tablet",
		year: 2021,
		platform: "android",
		osVersion: "10",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 16,
			bezel: 24,
			color: "#3a3b3f"
		},
		approx: true
	},
	{
		id: "nothing-phone-3",
		name: "Nothing Phone (3)",
		brand: "Nothing",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 10,
			color: "#e9e9e7"
		},
		approx: true
	},
	{
		id: "nothing-phone-3a",
		name: "Nothing Phone (3a)",
		brand: "Nothing",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 912
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 11,
			color: "#1e1e1e"
		},
		approx: true
	},
	{
		id: "nothing-phone-2a",
		name: "Nothing Phone (2a)",
		brand: "Nothing",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 919
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 11,
			color: "#f0efeb"
		},
		approx: true
	},
	{
		id: "cmf-phone-1",
		name: "CMF Phone 1",
		brand: "Nothing",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 12,
			color: "#f07c2a"
		},
		approx: true
	},
	{
		id: "nothing-phone-2",
		name: "Nothing Phone (2)",
		brand: "Nothing",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 919
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 30,
			bezel: 10,
			color: "#d9d9d6"
		},
		approx: true
	},
	{
		id: "nothing-phone-1",
		name: "Nothing Phone (1)",
		brand: "Nothing",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-left",
			screenRadius: 28,
			bezel: 10,
			color: "#232323"
		},
		approx: true
	},
	{
		id: "oppo-reno-12",
		name: "OPPO Reno12",
		brand: "OPPO",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 919
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 10,
			color: "#bfa6d9"
		},
		approx: true
	},
	{
		id: "vivo-v30",
		name: "vivo V30",
		brand: "vivo",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 10,
			color: "#4f8fbf"
		},
		approx: true
	},
	{
		id: "realme-12-pro",
		name: "realme 12 Pro",
		brand: "realme",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 919
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 10,
			color: "#2a3f6b"
		},
		approx: true
	},
	{
		id: "infinix-note-40-pro",
		name: "Infinix Note 40 Pro",
		brand: "Infinix",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 928
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#3c5a4a"
		},
		approx: true
	},
	{
		id: "infinix-hot-40i",
		name: "Infinix Hot 40i",
		brand: "Infinix",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 923
		},
		dpr: 1.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 24,
			bezel: 13,
			color: "#7fb9d6"
		},
		approx: true
	},
	{
		id: "infinix-hot-30",
		name: "Infinix Hot 30",
		brand: "Infinix",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 937
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 24,
			bezel: 13,
			color: "#2c2f36"
		},
		approx: true
	},
	{
		id: "infinix-note-30",
		name: "Infinix Note 30",
		brand: "Infinix",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 937
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 12,
			color: "#8fc6a5"
		},
		approx: true
	},
	{
		id: "infinix-smart-8",
		name: "Infinix Smart 8",
		brand: "Infinix",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 921
		},
		dpr: 1.75,
		frame: {
			cutout: "waterdrop",
			screenRadius: 22,
			bezel: 14,
			color: "#d8c39a"
		},
		approx: true
	},
	{
		id: "tecno-pova-6-pro",
		name: "Tecno Pova 6 Pro",
		brand: "Tecno",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 928
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#3a3d44"
		},
		approx: true
	},
	{
		id: "tecno-spark-20",
		name: "Tecno Spark 20",
		brand: "Tecno",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 921
		},
		dpr: 1.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 24,
			bezel: 13,
			color: "#e3d9c3"
		},
		approx: true
	},
	{
		id: "tecno-camon-20",
		name: "Tecno Camon 20",
		brand: "Tecno",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 11,
			color: "#4a6d5c"
		},
		approx: true
	},
	{
		id: "tecno-spark-10",
		name: "Tecno Spark 10",
		brand: "Tecno",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 921
		},
		dpr: 1.75,
		frame: {
			cutout: "waterdrop",
			screenRadius: 22,
			bezel: 14,
			color: "#7a9fd0"
		},
		approx: true
	},
	{
		id: "itel-a70",
		name: "itel A70",
		brand: "itel",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 921
		},
		dpr: 1.75,
		frame: {
			cutout: "waterdrop",
			screenRadius: 22,
			bezel: 15,
			color: "#3e5a7a"
		},
		approx: true
	},
	{
		id: "surface-duo-2",
		name: "Surface Duo 2",
		brand: "Microsoft",
		kind: "foldable",
		year: 2021,
		platform: "android",
		osVersion: "12",
		screen: {
			width: 540,
			height: 757
		},
		dpr: 2.5,
		frame: {
			cutout: "none",
			screenRadius: 10,
			bezel: 20,
			color: "#e9e9eb"
		},
		approx: true
	},
	{
		id: "surface-duo",
		name: "Surface Duo",
		brand: "Microsoft",
		kind: "foldable",
		year: 2020,
		platform: "android",
		osVersion: "11",
		screen: {
			width: 540,
			height: 720
		},
		dpr: 2.5,
		frame: {
			cutout: "none",
			screenRadius: 6,
			bezel: 24,
			color: "#e9e9eb"
		}
	},
	{
		id: "fire-hd-10",
		name: "Fire HD 10",
		brand: "Amazon",
		kind: "tablet",
		year: 2023,
		platform: "android",
		osVersion: "11",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 1.5,
		frame: {
			cutout: "none",
			screenRadius: 12,
			bezel: 30,
			color: "#1f1f21"
		},
		approx: true
	},
	{
		id: "fire-7",
		name: "Fire 7",
		brand: "Amazon",
		kind: "tablet",
		year: 2022,
		platform: "android",
		osVersion: "11",
		screen: {
			width: 600,
			height: 1024
		},
		dpr: 1,
		frame: {
			cutout: "none",
			screenRadius: 10,
			bezel: 32,
			color: "#1f1f21"
		},
		approx: true
	},
	{
		id: "kindle-fire-hdx",
		name: "Kindle Fire HDX",
		brand: "Amazon",
		kind: "tablet",
		year: 2013,
		platform: "android",
		osVersion: "4.4",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 6,
			bezel: 36,
			color: "#1f1f21"
		}
	}
];
// src/devices/catalog/samsung.ts
/**
* Samsung Galaxy phones, foldables and tablets. Sizes are CSS viewport pixels
* in portrait at the default (FHD+/QHD+) display setting; models without a
* widely published browser viewport are marked `approx`.
*/
var samsungDevices = [
	{
		id: "galaxy-s25-ultra",
		name: "Galaxy S25 Ultra",
		brand: "Samsung",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 384,
			height: 832
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 24,
			bezel: 9,
			color: "#3a3d42",
			finishes: [
				{
					name: "Titanium Black",
					color: "#3a3d42"
				},
				{
					name: "Titanium Gray",
					color: "#8a8b8d"
				},
				{
					name: "Titanium Silverblue",
					color: "#9aa7b8"
				},
				{
					name: "Titanium Whitesilver",
					color: "#d8d9db"
				}
			],
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s25-edge",
		name: "Galaxy S25 Edge",
		brand: "Samsung",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 384,
			height: 832
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#a9adb3",
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s25-plus",
		name: "Galaxy S25+",
		brand: "Samsung",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 384,
			height: 832
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#1f2836",
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s25",
		name: "Galaxy S25",
		brand: "Samsung",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 360,
			height: 780
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#c7d2e0",
			finishes: [
				{
					name: "Icyblue",
					color: "#c7d2e0"
				},
				{
					name: "Navy",
					color: "#283450"
				},
				{
					name: "Mint",
					color: "#cfe4d6"
				},
				{
					name: "Silver Shadow",
					color: "#bfc1c4"
				}
			],
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s24-ultra",
		name: "Galaxy S24 Ultra",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 384,
			height: 832
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 4,
			bezel: 9,
			color: "#4a4a4e",
			finishes: [
				{
					name: "Titanium Black",
					color: "#4a4a4e"
				},
				{
					name: "Titanium Gray",
					color: "#8d8b87"
				},
				{
					name: "Titanium Violet",
					color: "#6f6584"
				},
				{
					name: "Titanium Yellow",
					color: "#e7dcae"
				}
			],
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s24-plus",
		name: "Galaxy S24+",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 384,
			height: 832
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#e5d9c2",
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s24",
		name: "Galaxy S24",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 360,
			height: 780
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#c2b4d8",
			finishes: [
				{
					name: "Cobalt Violet",
					color: "#c2b4d8"
				},
				{
					name: "Onyx Black",
					color: "#2c2c2f"
				},
				{
					name: "Marble Gray",
					color: "#c8c8c6"
				},
				{
					name: "Amber Yellow",
					color: "#ead9a1"
				}
			],
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s24-fe",
		name: "Galaxy S24 FE",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 11,
			color: "#5c7fa8"
		},
		approx: true
	},
	{
		id: "galaxy-s23-ultra",
		name: "Galaxy S23 Ultra",
		brand: "Samsung",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 384,
			height: 824
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 4,
			bezel: 9,
			color: "#2f3b2f",
			edge: "rounded",
			rim: 2.5
		},
		approx: true
	},
	{
		id: "galaxy-s23-plus",
		name: "Galaxy S23+",
		brand: "Samsung",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 384,
			height: 832
		},
		dpr: 2.8125,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#d9cfe6",
			edge: "flat",
			rim: 3.5
		},
		approx: true
	},
	{
		id: "galaxy-s23",
		name: "Galaxy S23",
		brand: "Samsung",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 360,
			height: 780
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#e6e0d5",
			edge: "flat",
			rim: 3.5
		}
	},
	{
		id: "galaxy-s22-ultra",
		name: "Galaxy S22 Ultra",
		brand: "Samsung",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 384,
			height: 824
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 4,
			bezel: 9,
			color: "#5b1f2b",
			edge: "rounded",
			rim: 2.5
		},
		approx: true
	},
	{
		id: "galaxy-s22",
		name: "Galaxy S22",
		brand: "Samsung",
		kind: "phone",
		year: 2022,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 360,
			height: 780
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 9,
			color: "#2c4f45",
			edge: "flat",
			rim: 3.5
		}
	},
	{
		id: "galaxy-s21-ultra",
		name: "Galaxy S21 Ultra",
		brand: "Samsung",
		kind: "phone",
		year: 2021,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 384,
			height: 854
		},
		dpr: 3.75,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 9,
			color: "#1c1c1c",
			edge: "rounded",
			rim: 2.5
		},
		approx: true
	},
	{
		id: "galaxy-s21",
		name: "Galaxy S21",
		brand: "Samsung",
		kind: "phone",
		year: 2021,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 360,
			height: 800
		},
		dpr: 3,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#6d5a8e"
		}
	},
	{
		id: "galaxy-s20-ultra",
		name: "Galaxy S20 Ultra",
		brand: "Samsung",
		kind: "phone",
		year: 2020,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 3.5,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#3b3b3d"
		}
	},
	{
		id: "galaxy-s20",
		name: "Galaxy S20",
		brand: "Samsung",
		kind: "phone",
		year: 2020,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 360,
			height: 800
		},
		dpr: 4,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 28,
			bezel: 10,
			color: "#a6c4dd"
		},
		approx: true
	},
	{
		id: "galaxy-note-20-ultra",
		name: "Galaxy Note 20 Ultra",
		brand: "Samsung",
		kind: "phone",
		year: 2020,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 883
		},
		dpr: 3.5,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 4,
			bezel: 9,
			color: "#b9925f",
			edge: "rounded",
			rim: 2.5
		},
		approx: true
	},
	{
		id: "galaxy-s9-plus",
		name: "Galaxy S9+",
		brand: "Samsung",
		kind: "phone",
		year: 2018,
		platform: "android",
		osVersion: "10",
		screen: {
			width: 320,
			height: 658
		},
		dpr: 4.5,
		frame: {
			cutout: "none",
			screenRadius: 22,
			bezel: 14,
			color: "#5a3e7a"
		}
	},
	{
		id: "galaxy-s8-plus",
		name: "Galaxy S8+",
		brand: "Samsung",
		kind: "phone",
		year: 2017,
		platform: "android",
		osVersion: "9",
		screen: {
			width: 360,
			height: 740
		},
		dpr: 4,
		frame: {
			cutout: "none",
			screenRadius: 24,
			bezel: 16,
			color: "#2b2b2d"
		}
	},
	{
		id: "galaxy-a56",
		name: "Galaxy A56",
		brand: "Samsung",
		kind: "phone",
		year: 2025,
		platform: "android",
		osVersion: "15",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 12,
			color: "#a8b3a1"
		},
		approx: true
	},
	{
		id: "galaxy-a55",
		name: "Galaxy A55",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 12,
			color: "#c6c9ec"
		},
		approx: true
	},
	{
		id: "galaxy-a35",
		name: "Galaxy A35",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 12,
			color: "#9fb8d6"
		},
		approx: true
	},
	{
		id: "galaxy-a16",
		name: "Galaxy A16",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "waterdrop",
			screenRadius: 26,
			bezel: 12,
			color: "#3d4a5a"
		},
		approx: true
	},
	{
		id: "galaxy-a06",
		name: "Galaxy A06",
		brand: "Samsung",
		kind: "phone",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 914
		},
		dpr: 1.75,
		frame: {
			cutout: "waterdrop",
			screenRadius: 24,
			bezel: 13,
			color: "#2a2d33"
		},
		approx: true
	},
	{
		id: "galaxy-a54",
		name: "Galaxy A54",
		brand: "Samsung",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 30,
			bezel: 12,
			color: "#cbbfe3"
		},
		approx: true
	},
	{
		id: "galaxy-a25",
		name: "Galaxy A25",
		brand: "Samsung",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "waterdrop",
			screenRadius: 26,
			bezel: 12,
			color: "#2f3d5c"
		},
		approx: true
	},
	{
		id: "galaxy-a15",
		name: "Galaxy A15",
		brand: "Samsung",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 892
		},
		dpr: 2.625,
		frame: {
			cutout: "waterdrop",
			screenRadius: 26,
			bezel: 12,
			color: "#3a4150"
		},
		approx: true
	},
	{
		id: "galaxy-a14",
		name: "Galaxy A14",
		brand: "Samsung",
		kind: "phone",
		year: 2023,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 915
		},
		dpr: 2.625,
		frame: {
			cutout: "waterdrop",
			screenRadius: 24,
			bezel: 13,
			color: "#9a3a3a"
		},
		approx: true
	},
	{
		id: "galaxy-a71",
		name: "Galaxy A71",
		brand: "Samsung",
		kind: "phone",
		year: 2020,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 914
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 12,
			color: "#2d3a4f"
		}
	},
	{
		id: "galaxy-a51",
		name: "Galaxy A51",
		brand: "Samsung",
		kind: "phone",
		year: 2019,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 412,
			height: 914
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 12,
			color: "#3b3f58"
		}
	},
	{
		id: "galaxy-z-fold-7",
		name: "Galaxy Z Fold 7 (folded)",
		brand: "Samsung",
		kind: "foldable",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 412,
			height: 960
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 22,
			bezel: 9,
			color: "#2c3340",
			edge: "flat",
			rim: 3,
			hinge: "left"
		},
		approx: true
	},
	{
		id: "galaxy-z-fold-7-unfolded",
		name: "Galaxy Z Fold 7 (unfolded)",
		brand: "Samsung",
		kind: "foldable",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 750,
			height: 832
		},
		dpr: 2.625,
		frame: {
			cutout: "none",
			screenRadius: 20,
			bezel: 10,
			color: "#2c3340",
			crease: true,
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "galaxy-z-fold-6",
		name: "Galaxy Z Fold 6 (folded)",
		brand: "Samsung",
		kind: "foldable",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 369,
			height: 905
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 20,
			bezel: 10,
			color: "#e1c7cf",
			finishes: [
				{
					name: "Pink",
					color: "#e1c7cf"
				},
				{
					name: "Silver Shadow",
					color: "#bcc0c4"
				},
				{
					name: "Navy",
					color: "#2b3448"
				}
			],
			edge: "flat",
			rim: 3,
			hinge: "left"
		},
		approx: true
	},
	{
		id: "galaxy-z-fold-6-unfolded",
		name: "Galaxy Z Fold 6 (unfolded)",
		brand: "Samsung",
		kind: "foldable",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 707,
			height: 823
		},
		dpr: 2.625,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 11,
			color: "#e1c7cf",
			crease: true,
			finishes: [
				{
					name: "Pink",
					color: "#e1c7cf"
				},
				{
					name: "Silver Shadow",
					color: "#bcc0c4"
				},
				{
					name: "Navy",
					color: "#2b3448"
				}
			],
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "galaxy-z-fold-5",
		name: "Galaxy Z Fold 5 (folded)",
		brand: "Samsung",
		kind: "foldable",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 344,
			height: 882
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 20,
			bezel: 10,
			color: "#bcc9d8",
			edge: "flat",
			rim: 3,
			hinge: "left"
		}
	},
	{
		id: "galaxy-z-fold-5-unfolded",
		name: "Galaxy Z Fold 5 (unfolded)",
		brand: "Samsung",
		kind: "foldable",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 690,
			height: 829
		},
		dpr: 2.625,
		frame: {
			cutout: "none",
			screenRadius: 18,
			bezel: 11,
			color: "#bcc9d8",
			crease: true,
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "galaxy-z-flip-7",
		name: "Galaxy Z Flip 7",
		brand: "Samsung",
		kind: "foldable",
		year: 2025,
		platform: "android",
		osVersion: "16",
		screen: {
			width: 412,
			height: 960
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 10,
			color: "#2f4f7a",
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "galaxy-z-flip-6",
		name: "Galaxy Z Flip 6",
		brand: "Samsung",
		kind: "foldable",
		year: 2024,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 1006
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 10,
			color: "#d9e7a6",
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "galaxy-z-flip-5",
		name: "Galaxy Z Flip 5",
		brand: "Samsung",
		kind: "foldable",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 412,
			height: 1006
		},
		dpr: 2.625,
		frame: {
			cutout: "punch-hole-center",
			screenRadius: 26,
			bezel: 10,
			color: "#cfc3e8",
			edge: "flat",
			rim: 3
		},
		approx: true
	},
	{
		id: "galaxy-tab-s9",
		name: "Galaxy Tab S9",
		brand: "Samsung",
		kind: "tablet",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 16,
			bezel: 22,
			color: "#3a3b3f"
		},
		approx: true
	},
	{
		id: "galaxy-tab-a9-plus",
		name: "Galaxy Tab A9+",
		brand: "Samsung",
		kind: "tablet",
		year: 2023,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 1.5,
		frame: {
			cutout: "none",
			screenRadius: 14,
			bezel: 26,
			color: "#8f9399"
		},
		approx: true
	},
	{
		id: "galaxy-tab-s8",
		name: "Galaxy Tab S8",
		brand: "Samsung",
		kind: "tablet",
		year: 2022,
		platform: "android",
		osVersion: "14",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 16,
			bezel: 22,
			color: "#d3d4d8"
		},
		approx: true
	},
	{
		id: "galaxy-tab-s7",
		name: "Galaxy Tab S7",
		brand: "Samsung",
		kind: "tablet",
		year: 2020,
		platform: "android",
		osVersion: "13",
		screen: {
			width: 800,
			height: 1280
		},
		dpr: 2,
		frame: {
			cutout: "none",
			screenRadius: 16,
			bezel: 22,
			color: "#2e2f33"
		},
		approx: true
	}
];
// src/devices/index.ts
/** Every device, validated once at load. A bad catalog entry fails loudly here. */
var devices = array(deviceSchema).parse([
	...appleDevices,
	...samsungDevices,
	...googleDevices,
	...otherDevices
]);
new Map(devices.map((device) => [device.id, device]));
/** Brands shown first in the picker; any other brand follows alphabetically. */
var BRAND_PRIORITY = [
	"Apple",
	"Samsung",
	"Google"
];
function brandRank(brand) {
	const index = BRAND_PRIORITY.indexOf(brand);
	return index === -1 ? BRAND_PRIORITY.length : index;
}
function compareBrands(a, b) {
	return brandRank(a) - brandRank(b) || a.localeCompare(b);
}
var KIND_ORDER = {
	phone: 0,
	foldable: 1,
	tablet: 2
};
/** Newest first; within a year phones, then foldables, then tablets; larger screens first, then by name. */
function sortNewestFirst(list) {
	return [...list].sort((a, b) => b.year - a.year || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.screen.width * b.screen.height - a.screen.width * a.screen.height || a.name.localeCompare(b.name));
}
[...new Set(devices.map((device) => device.brand))].sort(compareBrands);
/** "390×844 @3x" */
function formatScreen(device) {
	return `${device.screen.width}×${device.screen.height} @${device.dpr}x`;
}
// package.json
var version = "0.4.0";
// src/cli/devicesSelect.ts
var PRESET_NAMES = [
	"common",
	"phones",
	"all-sizes"
];
/** Fixed presets. A unit test checks every id exists in the catalog. */
var FIXED_PRESETS = {
	common: [
		"iphone-se-3",
		"iphone-16-pro",
		"galaxy-a16",
		"pixel-9",
		"ipad-mini-a17-pro"
	],
	phones: [
		"iphone-se-3",
		"iphone-16-pro",
		"iphone-17-pro-max",
		"galaxy-a16",
		"galaxy-s25-ultra",
		"pixel-9"
	]
};
/**
* CSS-width buckets for `all-sizes` (upper bounds, inclusive): small phones,
* classic phones, current phones, large phones, foldable inner screens,
* small tablets, large tablets.
*/
var WIDTH_BUCKETS = [
	360,
	380,
	400,
	420,
	500,
	760,
	900,
	Number.POSITIVE_INFINITY
];
/**
* One device per CSS width bucket: the bucket's most common width (what most
* real phones in that class report), then the newest confirmed device with it.
*/
function allSizesPreset(catalog) {
	const newest = sortNewestFirst(catalog);
	const picked = [];
	let lower = 0;
	for (const upper of WIDTH_BUCKETS) {
		const inBucket = newest.filter((device) => device.screen.width > lower && device.screen.width <= upper);
		lower = upper;
		const counts = /* @__PURE__ */ new Map();
		for (const device of inBucket) counts.set(device.screen.width, (counts.get(device.screen.width) ?? 0) + 1);
		const [commonWidth] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] ?? [];
		const withWidth = inBucket.filter((device) => device.screen.width === commonWidth);
		const choice = withWidth.find((device) => !device.approx) ?? withWidth[0];
		if (choice) picked.push(choice);
	}
	return picked;
}
function levenshtein(a, b) {
	const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i += 1) {
		let diagonal = previous[0] ?? 0;
		previous[0] = i;
		for (let j = 1; j <= b.length; j += 1) {
			const above = previous[j] ?? 0;
			const left = previous[j - 1] ?? 0;
			previous[j] = Math.min(above + 1, left + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
			diagonal = above;
		}
	}
	return previous[b.length] ?? 0;
}
/** The `limit` catalog ids closest to `input` (ids containing it rank first). */
function closestIds(input, catalog, limit = 3) {
	const wanted = input.toLowerCase().trim();
	return catalog.map((device) => {
		const distance = levenshtein(wanted, device.id);
		const contains = device.id.includes(wanted) || wanted.includes(device.id);
		return {
			id: device.id,
			score: contains ? distance - 100 : distance
		};
	}).sort((a, b) => a.score - b.score || a.id.localeCompare(b.id)).slice(0, limit).map((entry) => entry.id);
}
/** Resolves `--devices` ids (in the given order) or a preset name to catalog devices. */
function selectDevices(input, catalog) {
	const byId = new Map(catalog.map((device) => [device.id, device]));
	if (input.devices && input.devices.length > 0) {
		const picked = [];
		for (const id of input.devices) {
			const device = byId.get(id);
			if (!device) {
				const suggestions = closestIds(id, catalog);
				return {
					ok: false,
					message: `Unknown device ${id}. Did you mean: ${suggestions.join(", ")}?`,
					suggestions
				};
			}
			if (!picked.includes(device)) picked.push(device);
		}
		return {
			ok: true,
			devices: picked
		};
	}
	const preset = input.preset ?? "common";
	if (preset === "all-sizes") return {
		ok: true,
		devices: allSizesPreset(catalog)
	};
	return {
		ok: true,
		devices: FIXED_PRESETS[preset].flatMap((id) => {
			const device = byId.get(id);
			return device ? [device] : [];
		})
	};
}
// src/cli/command.ts
/**
* What people type to run phone-sim, used in help text, hints and error messages.
* Runs straight from GitHub for now; switch to "npx phone-sim" once it is on npm.
*/
var RUN = "npx -y github:Abmichael01/phone-sim";
// src/cli/args.ts
var DEFAULT_OUT_DIR = "phone-sim-report";
var intText = (name, min, max, fallback) => string().optional().transform((value, context) => {
	if (value === void 0) return fallback;
	const number = Number(value);
	if (!Number.isInteger(number) || number < min || number > max) {
		context.addIssue({
			code: "custom",
			message: `--${name} must be a whole number of milliseconds between ${min} and ${max} (got "${value}").`
		});
		return NEVER;
	}
	return number;
});
var checkSchema = object({
	url: string().optional(),
	devices: string().optional().transform((value) => value === void 0 ? void 0 : value.split(",").map((id) => id.trim().toLowerCase()).filter(Boolean)),
	preset: string().optional().refine((value) => value === void 0 || PRESET_NAMES.includes(value), { message: `--preset must be one of: ${PRESET_NAMES.join(", ")}.` }).transform((value) => value),
	landscape: boolean(),
	fullPage: boolean(),
	wait: intText("wait", 0, 12e4, 500),
	timeout: intText("timeout", 1e3, 6e5, 3e4),
	out: string().min(1, "--out needs a folder name."),
	json: boolean(),
	frame: boolean(),
	annotate: boolean(),
	failOn: _enum([
		"error",
		"warn",
		"never"
	], { message: "--fail-on must be error, warn or never." }),
	open: boolean(),
	all: boolean(),
	debug: boolean()
}).refine((value) => !(value.devices && value.preset), { message: "Use either --devices or --preset, not both." }).refine((value) => value.devices === void 0 || value.devices.length > 0, { message: "--devices needs at least one device id." });
var CHECK_OPTIONS = {
	devices: { type: "string" },
	preset: { type: "string" },
	landscape: {
		type: "boolean",
		default: false
	},
	"full-page": {
		type: "boolean",
		default: false
	},
	wait: { type: "string" },
	timeout: { type: "string" },
	out: {
		type: "string",
		default: DEFAULT_OUT_DIR
	},
	json: {
		type: "boolean",
		default: false
	},
	"no-frame": {
		type: "boolean",
		default: false
	},
	"no-annotate": {
		type: "boolean",
		default: false
	},
	"fail-on": {
		type: "string",
		default: "error"
	},
	open: {
		type: "boolean",
		default: false
	},
	all: {
		type: "boolean",
		default: false
	},
	debug: {
		type: "boolean",
		default: false
	},
	help: {
		type: "boolean",
		short: "h",
		default: false
	}
};
var DEVICES_OPTIONS = {
	search: { type: "string" },
	json: {
		type: "boolean",
		default: false
	},
	help: {
		type: "boolean",
		short: "h",
		default: false
	}
};
var INIT_OPTIONS = {
	"dry-run": {
		type: "boolean",
		default: false
	},
	debug: {
		type: "boolean",
		default: false
	},
	help: {
		type: "boolean",
		short: "h",
		default: false
	}
};
/** Node's parseArgs messages are long; keep just the option name. */
function friendlyParseError(error) {
	const text = error instanceof Error ? error.message : String(error);
	const unknown = /Unknown option '([^']+)'/.exec(text);
	if (unknown?.[1]) return `Unknown option ${unknown[1]}.`;
	const ambiguous = /Option '([^']+)' argument is ambiguous/.exec(text);
	if (ambiguous?.[1]) return `${ambiguous[1]} needs a value (write values that start with "-" as ${ambiguous[1]}=<value>).`;
	const missing = /Option '([^']+)'.*argument missing/.exec(text);
	if (missing?.[1]) return `${missing[1].split(" ")[0] ?? missing[1]} needs a value.`;
	const extra = /Unexpected argument '([^']+)'/.exec(text);
	if (extra?.[1]) return `Unexpected argument "${extra[1]}".`;
	return text.split(". ")[0] ?? text;
}
/** Something typed in place of a command that is clearly a URL, port or HTML file. */
function looksLikeTarget(word) {
	return /^:?\d{2,5}$/.test(word) || /[.:/]/.test(word);
}
/** Parses `process.argv.slice(2)`. Pure: never exits or prints. */
function parseCli(argv) {
	const debug = argv.includes("--debug");
	const [first, ...rest] = argv;
	if (first === void 0 || first === "help" || first === "--help" || first === "-h") return {
		ok: true,
		value: { command: "help" }
	};
	if (first === "--version" || first === "-v" || first === "version") return {
		ok: true,
		value: { command: "version" }
	};
	try {
		if (first === "devices") {
			const { values } = parseArgs({
				args: [...rest],
				options: DEVICES_OPTIONS,
				allowPositionals: false,
				strict: true
			});
			if (values.help) return {
				ok: true,
				value: { command: "help" }
			};
			return {
				ok: true,
				value: {
					command: "devices",
					options: {
						search: values.search,
						json: values.json
					}
				}
			};
		}
		if (first === "init") {
			const { values } = parseArgs({
				args: [...rest],
				options: INIT_OPTIONS,
				allowPositionals: false,
				strict: true
			});
			if (values.help) return {
				ok: true,
				value: { command: "help" }
			};
			return {
				ok: true,
				value: {
					command: "init",
					options: {
						dryRun: values["dry-run"],
						debug: values.debug
					}
				}
			};
		}
		let checkArgs;
		if (first === "check") checkArgs = [...rest];
		else if (first.startsWith("-") || looksLikeTarget(first)) checkArgs = [...argv];
		else return {
			ok: false,
			message: `Unknown command "${first}".`,
			debug
		};
		const { values, positionals } = parseArgs({
			args: checkArgs,
			options: CHECK_OPTIONS,
			allowPositionals: true,
			strict: true
		});
		if (values.help) return {
			ok: true,
			value: { command: "help" }
		};
		if (positionals.length > 1) return {
			ok: false,
			message: `Give one URL to check (got ${positionals.length}: ${positionals.join(" ")}).`,
			debug
		};
		const parsed = checkSchema.safeParse({
			url: positionals[0],
			devices: values.devices,
			preset: values.preset,
			landscape: values.landscape,
			fullPage: values["full-page"],
			wait: values.wait,
			timeout: values.timeout,
			out: values.out,
			json: values.json,
			frame: !values["no-frame"],
			annotate: !values["no-annotate"],
			failOn: values["fail-on"],
			open: values.open,
			all: values.all,
			debug: values.debug
		});
		if (!parsed.success) return {
			ok: false,
			message: parsed.error.issues[0]?.message ?? "Invalid options.",
			debug
		};
		return {
			ok: true,
			value: {
				command: "check",
				options: parsed.data
			}
		};
	} catch (error) {
		return {
			ok: false,
			message: friendlyParseError(error),
			debug
		};
	}
}
var HELP_TEXT = `phone-sim: check a web page on real phone and tablet screen sizes

  ${RUN} check
      find your local dev server and check it
  ${RUN} check localhost:5173
      check a URL, a port (3000) or an .html file
  ${RUN} init
      tell AI agents in this repo to run the check

Check options
  --preset <name>       common (default), phones or all-sizes
  --devices <id,id>     exact devices (list them with: phone-sim devices)
  --landscape           also check every device turned sideways
  --full-page           screenshot the whole page, not just the screen
  --json                print the report as JSON on stdout (for AI agents)
  --out <dir>           where screenshots and reports go (default: ./phone-sim-report)
  --fail-on <level>     exit 1 on: error (default), warn or never
  --open                open the HTML report when done
  --all                 list every issue and note (output is short by default)
  --wait <ms>           extra wait after the page loads (default: 500)
  --timeout <ms>        page load timeout (default: 30000)
  --no-frame            plain screenshots without the device drawn around them
  --no-annotate         no numbered boxes on the screenshots
  --debug               show full error details

Other commands
  phone-sim devices [--search <text>] [--json]   list device ids
  phone-sim init [--dry-run]                     add the check to AGENTS.md

Exit codes: 0 no problems, 1 problems found, 2 could not run the check.`;
// src/cli/issues.ts
var severitySchema = _enum([
	"error",
	"warn",
	"info"
]);
var ruleIdSchema = _enum([
	"viewport-meta",
	"horizontal-overflow",
	"small-tap-target",
	"small-text",
	"ios-input-zoom",
	"text-clipped",
	"fixed-covers-screen",
	"safe-area",
	"image-oversize"
]);
var rectSchema = object({
	x: number(),
	y: number(),
	width: number().nonnegative(),
	height: number().nonnegative()
});
var issueSchema = object({
	/** 1-based; matches the numbered badge on the annotated screenshot. Issues found on every device share their number. */
	number: number().int().positive(),
	rule: ruleIdSchema,
	severity: severitySchema,
	/** CSS selector. For a group (`count` > 1) the shared shape, e.g. "sup.reference > a". */
	selector: string(),
	/** Grouping key: tag + stable classes of the element and its parent (no ids, no positions). */
	group: string(),
	/** Up to 3 real selectors of grouped elements (may use ids). */
	examples: array(string()),
	message: string(),
	/** One line on how to fix it. */
	hint: string(),
	/** Element text or other context to search the code with. */
	detail: string(),
	/** Box of the worst element, page coordinates in CSS px (null for page-level issues). */
	rect: rectSchema.nullable(),
	/** Boxes of every grouped element (at most MAX_BOXES). */
	rects: array(rectSchema),
	/** How many elements share this issue. */
	count: number().int().positive(),
	/** The same issue was found on every checked device. */
	onAllDevices: boolean()
});
var orientationSchema = _enum(["portrait", "landscape"]);
var countsSchema = object({
	errors: number().int().nonnegative(),
	warnings: number().int().nonnegative(),
	infos: number().int().nonnegative()
});
var deviceReportSchema = object({
	id: string(),
	name: string(),
	viewport: object({
		width: number().int().positive(),
		height: number().int().positive()
	}),
	dpr: number().positive(),
	orientation: orientationSchema,
	/** HTTP status of the page (null for file:// pages). */
	status: number().int().nullable(),
	/** Framed + annotated screenshot (absolute path). */
	screenshot: string(),
	/** Plain viewport screenshot (absolute path). */
	rawScreenshot: string(),
	issues: array(issueSchema),
	/** Issues left out of `issues` by the size cap (run with --all for every one). */
	omitted: countsSchema
});
var summarySchema = countsSchema;
var reportSchema = object({
	url: string(),
	checkedAt: string(),
	tool: object({
		name: literal("phone-sim"),
		version: string()
	}),
	outDir: string(),
	reportHtml: string(),
	/** How the viewport was sized; real browsers subtract their toolbars. */
	viewportNote: string(),
	devices: array(deviceReportSchema),
	/** Every issue found, including ones left out by the cap. */
	summary: summarySchema
});
var VIEWPORT_NOTE = "Each device is checked with the viewport set to its full screen size. Real browsers subtract their address bar and toolbar, so the visible area is a little shorter; widths are exact.";
var SEVERITY_ORDER = {
	error: 0,
	warn: 1,
	info: 2
};
/** Within a severity, the problems that hurt the most come first. */
var IMPACT_ORDER = [
	"viewport-meta",
	"horizontal-overflow",
	"fixed-covers-screen",
	"ios-input-zoom",
	"text-clipped",
	"safe-area",
	"small-tap-target",
	"small-text",
	"image-oversize"
];
/** For these rules a smaller measurement is worse (px size); for the rest a larger one is. */
var SMALLER_IS_WORSE = /* @__PURE__ */ new Set([
	"small-tap-target",
	"small-text",
	"ios-input-zoom",
	"safe-area"
]);
/** Issues that are never merged: each overflow root cause needs its own fix. */
var NEVER_GROUPED = /* @__PURE__ */ new Set(["horizontal-overflow", "viewport-meta"]);
var RULE_HINTS = {
	"viewport-meta": "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> inside <head>.",
	"horizontal-overflow": "Remove the fixed width (use max-width: 100%), let rows wrap (flex-wrap: wrap, min-width: 0), or make wide content scroll inside its own box (overflow-x: auto).",
	"small-tap-target": "Make it at least 24×24px (44×44px is better): add padding or min-width/min-height.",
	"small-text": "Use at least 12px for small print and 16px for body text.",
	"ios-input-zoom": "Set font-size: 16px (or more) on inputs, selects and textareas so iPhone Safari does not zoom in.",
	"text-clipped": "Let the text wrap (remove white-space: nowrap or the fixed width), or add text-overflow: ellipsis if cutting it is intended.",
	"fixed-covers-screen": "Make the cookie banner, sticky header or popup smaller on phones (or let it scroll away) so the page stays readable.",
	"safe-area": "Add padding-top: env(safe-area-inset-top) / padding-bottom: env(safe-area-inset-bottom) so the notch or home bar does not cover it.",
	"image-oversize": "Serve a smaller file for phones with srcset/sizes or an image CDN; it wastes download time."
};
function worse(rule, a, b) {
	if (SMALLER_IS_WORSE.has(rule)) return b.value < a.value ? b : a;
	return b.value > a.value ? b : a;
}
/** Severity, then how much the rule hurts, then how many elements it affects, then how bad the worst one is. */
function byImpact(a, b) {
	return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || IMPACT_ORDER.indexOf(a.rule) - IMPACT_ORDER.indexOf(b.rule) || b.count - a.count || (SMALLER_IS_WORSE.has(a.rule) ? a.value - b.value : b.value - a.value) || a.selector.localeCompare(b.selector);
}
/**
* Dedupes identical findings, groups look-alike elements (same rule, severity
* and shape, e.g. every footnote link), sorts by impact and numbers the result.
*/
function groupIssues(raw) {
	const seen = /* @__PURE__ */ new Set();
	const groups = /* @__PURE__ */ new Map();
	for (const issue of raw) {
		const exact = `${issue.rule}|${issue.severity}|${issue.selector}|${issue.message}`;
		if (seen.has(exact)) continue;
		seen.add(exact);
		const key = NEVER_GROUPED.has(issue.rule) ? exact : `${issue.rule}|${issue.severity}|${issue.groupKey}`;
		const group = groups.get(key);
		if (group) {
			group.members.push(issue);
			group.worst = worse(issue.rule, group.worst, issue);
		} else groups.set(key, {
			members: [issue],
			worst: issue
		});
	}
	const merged = [...groups.values()].map(({ members, worst }) => {
		const count = members.length;
		const others = members.filter((member) => member !== worst);
		const rects = [worst, ...others].flatMap((member) => member.rect ? [member.rect] : []).slice(0, 20);
		return {
			rule: worst.rule,
			severity: worst.severity,
			selector: count > 1 ? worst.groupKey : worst.selector,
			group: worst.groupKey,
			examples: count > 1 ? [worst, ...others].slice(0, 3).map((member) => member.selector) : [],
			message: count > 1 ? `${count} elements: worst ${worst.message}` : worst.message,
			hint: RULE_HINTS[worst.rule],
			detail: worst.detail,
			rect: worst.rect,
			rects,
			count,
			onAllDevices: false,
			value: worst.value
		};
	});
	merged.sort(byImpact);
	return merged.map(({ value: _value, ...issue }, index) => ({
		number: index + 1,
		...issue
	}));
}
/** Identity of an issue across devices: rule + severity + shape (the element itself for overflow). */
function issueKey(issue) {
	return `${issue.rule}|${issue.severity}|${NEVER_GROUPED.has(issue.rule) ? issue.selector : issue.group}`;
}
/** Keys per issue, with a suffix when the same key appears twice on one device. */
function keysOf(issues) {
	const seen = /* @__PURE__ */ new Map();
	return issues.map((issue) => {
		const key = issueKey(issue);
		const times = seen.get(key) ?? 0;
		seen.set(key, times + 1);
		return times === 0 ? key : `${key}#${times}`;
	});
}
/**
* Gives every distinct issue one number for the whole report, so "issue 7"
* means the same thing on every screenshot. Issues found on every device come
* first (in the first device's order), then the rest in order of first
* appearance. Each device's issues are returned sorted by that number.
* With one device nothing is marked as shared.
*/
function alignAcrossDevices(devices) {
	const keyed = devices.map((issues) => ({
		issues,
		keys: keysOf(issues)
	}));
	const keySets = keyed.map(({ keys }) => new Set(keys));
	const shared = new Set(devices.length < 2 ? [] : (keyed[0]?.keys ?? []).filter((key) => keySets.every((keys) => keys.has(key))));
	const numbers = /* @__PURE__ */ new Map();
	for (const key of keyed[0]?.keys ?? []) if (shared.has(key)) numbers.set(key, numbers.size + 1);
	for (const { keys } of keyed) for (const key of keys) if (!numbers.has(key)) numbers.set(key, numbers.size + 1);
	return keyed.map(({ issues, keys }) => issues.map((issue, index) => {
		const key = keys[index] ?? "";
		return {
			...issue,
			number: numbers.get(key) ?? index + 1,
			onAllDevices: shared.has(key)
		};
	}).sort((a, b) => a.number - b.number));
}
function countIssues(issues) {
	const counts = {
		errors: 0,
		warnings: 0,
		infos: 0
	};
	for (const issue of issues) if (issue.severity === "error") counts.errors += 1;
	else if (issue.severity === "warn") counts.warnings += 1;
	else counts.infos += 1;
	return counts;
}
function summarize(devices) {
	return devices.reduce((total, device) => {
		const counts = countIssues(device.issues);
		return {
			errors: total.errors + counts.errors,
			warnings: total.warnings + counts.warnings,
			infos: total.infos + counts.infos
		};
	}, {
		errors: 0,
		warnings: 0,
		infos: 0
	});
}
/** No caps: every issue and note (--all). */
var NO_CAP = {
	cap: Number.POSITIVE_INFINITY,
	infos: true
};
/** Default JSON: errors and warnings only, at most JSON_ISSUE_CAP per device. */
var JSON_CAP = {
	cap: 25,
	infos: false
};
/** Keeps the `cap` most severe issues (errors first, then by number) in their order and counts what was left out. */
function capIssues(issues, options) {
	const ranked = [...issues.filter((issue) => options.infos || issue.severity !== "info")].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.number - b.number);
	const keep = new Set(ranked.slice(0, Math.max(0, options.cap)));
	return {
		issues: issues.filter((issue) => keep.has(issue)),
		omitted: countIssues(issues.filter((issue) => !keep.has(issue)))
	};
}
/** The report with capped issues per device (summary still counts everything). */
function capReport(report, options) {
	return {
		...report,
		devices: report.devices.map((device) => {
			const { issues, omitted } = capIssues(device.issues, options);
			return {
				...device,
				issues,
				omitted
			};
		})
	};
}
/** 1 when issues at or above `failOn` exist, else 0. */
function exitCodeFor(summary, failOn) {
	if (failOn === "never") return 0;
	if (summary.errors > 0) return 1;
	if (failOn === "warn" && summary.warnings > 0) return 1;
	return 0;
}
// src/cli/init.ts
/** `phone-sim init`: tells AI agents working in a repo to run the responsive check. */
var START_MARKER = "<!-- phone-sim:start -->";
var END_MARKER = "<!-- phone-sim:end -->";
var REPORT_DIR_IGNORE = "phone-sim-report/";
var AGENT_SECTION = `${START_MARKER}
## Responsive check (phone-sim)

After every UI change, check the page on real phone and tablet sizes:

1. With the dev server running, run \`${RUN} check <url> --json\`
   (leave out the URL and it finds the local dev server on its own).
2. Fix every error and warning it reports. Each one names the rule, a CSS selector, what is wrong and how to fix it.
3. Run the check again until it reports no errors and no warnings.
4. Look at the annotated screenshots in \`phone-sim-report/\` (\`<device>.png\`): numbered boxes mark each problem, and \`report.html\` shows all devices side by side.
${END_MARKER}`;
/** Inserts or replaces the marked section; returns the text unchanged when it is already current. */
function upsertSection(text, section = AGENT_SECTION) {
	const start = text.indexOf(START_MARKER);
	const end = text.indexOf(END_MARKER);
	if (start !== -1 && end > start) return text.slice(0, start) + section + text.slice(end + 22);
	if (text.trim() === "") return `${section}\n`;
	return `${text}${text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n"}${section}\n`;
}
/** Adds the report folder to .gitignore text unless an equivalent line is there. */
function addIgnoreLine(text) {
	if (text.split(/\r?\n/).map((line) => line.trim()).some((line) => [
		"phone-sim-report",
		"phone-sim-report/",
		"/phone-sim-report",
		"/phone-sim-report/"
	].includes(line))) return text;
	return `${text}${text === "" || text.endsWith("\n") ? "" : "\n"}${REPORT_DIR_IGNORE}\n`;
}
/** CLAUDE.md that already pulls in AGENTS.md (e.g. "@AGENTS.md") needs no copy of the section. */
function referencesAgents(text) {
	return /AGENTS\.md/i.test(text);
}
/** Applies (or with dryRun only plans) the init edits in `dir`. */
function runInit(dir, dryRun) {
	const changes = [];
	const edit = (name, transform, description) => {
		const path = join(dir, name);
		const exists = existsSync(path);
		const before = exists ? readFileSync(path, "utf8") : "";
		const after = transform(before);
		if (exists && after === before) {
			changes.push({
				file: name,
				action: "unchanged",
				description: "already set up"
			});
			return;
		}
		if (!dryRun) writeFileSync(path, after);
		changes.push({
			file: name,
			action: exists ? "updated" : "created",
			description
		});
	};
	edit("AGENTS.md", (text) => upsertSection(text), "added the \"Responsive check\" section");
	const claudePath = join(dir, "CLAUDE.md");
	if (existsSync(claudePath)) {
		const claude = readFileSync(claudePath, "utf8");
		if (referencesAgents(claude) && !claude.includes("<!-- phone-sim:start -->")) changes.push({
			file: "CLAUDE.md",
			action: "unchanged",
			description: "already points to AGENTS.md"
		});
		else edit("CLAUDE.md", (text) => upsertSection(text), "added the \"Responsive check\" section");
	}
	edit(".gitignore", addIgnoreLine, `ignores ${REPORT_DIR_IGNORE}`);
	return changes;
}
// src/cli/overlay.ts
/** Numbered boxes drawn over the page before the annotated screenshot. */
var SEVERITY_COLORS = {
	error: "#e5484d",
	warn: "#f5a524",
	info: "#3b82f6"
};
function overlaps(a, b) {
	return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
/** Smallest x at height `y` that is inside a rounded top corner of radius `r`. */
function cornerInset(y, r) {
	if (r <= 0 || y >= r) return 0;
	return r - Math.sqrt(r * r - (r - y) * (r - y));
}
/** Places a badge at the top-left of its box, then nudges it out of corners, cutouts and other badges. */
function placeBadge(rect, shape, taken) {
	const size = 18;
	let x = rect.x - 6;
	let y = Math.max(0, rect.y - size / 2);
	for (let attempt = 0; attempt < 40; attempt += 1) {
		const inset = Math.max(cornerInset(y, shape.cornerRadius), cornerInset(y + size, shape.cornerRadius));
		x = Math.min(Math.max(x, inset + 2, 0), shape.width - size - inset - 2);
		const badge = {
			x,
			y,
			width: size,
			height: size
		};
		const cutout = shape.avoid.find((area) => overlaps(badge, {
			x: area.x - 2,
			y: area.y - 2,
			width: area.width + 4,
			height: area.height + 4
		}));
		if (cutout) {
			if (cutout.width >= cutout.height) y = cutout.y + cutout.height + 4;
			else x = cutout.x + cutout.width + 4;
			continue;
		}
		const clash = taken.find((other) => overlaps(badge, other));
		if (!clash) return {
			x,
			y
		};
		x = clash.x + size + 3;
		if (x > shape.width - size - 2) {
			x = rect.x;
			y = clash.y + size + 3;
		}
	}
	return {
		x,
		y
	};
}
/** Boxes and numbered badges for every issue with a position, numbered like the report. */
function layoutOverlay(issues, shape) {
	const boxes = [];
	const badges = [];
	const taken = [];
	for (const issue of issues) {
		const color = SEVERITY_COLORS[issue.severity];
		issue.rects.forEach((rect, index) => {
			const left = Math.max(0, rect.x);
			const right = Math.min(shape.width, rect.x + rect.width);
			const width = Math.max(4, right - left);
			const clamped = {
				x: Math.min(left, shape.width - width),
				y: rect.y,
				width,
				height: Math.max(4, rect.height)
			};
			boxes.push({
				rect: clamped,
				color
			});
			if (index > 0) return;
			const spot = placeBadge(clamped, shape, taken);
			taken.push({
				...spot,
				width: 18,
				height: 18
			});
			badges.push({
				number: issue.number,
				color,
				...spot
			});
		});
	}
	return {
		boxes,
		badges
	};
}
var px = (value) => `${Math.round(value * 100) / 100}px`;
/**
* The overlay as HTML, positioned in screenshot (page) CSS px. It is drawn over
* the screenshot when the framed image is rendered, so the checked page is
* never touched and numbers can be aligned across devices afterwards.
*/
function overlayHtml(overlay) {
	const boxes = overlay.boxes.map((box) => `<div style="position:absolute;box-sizing:border-box;left:${px(box.rect.x)};top:${px(box.rect.y)};width:${px(box.rect.width)};height:${px(box.rect.height)};border:2px solid ${box.color};border-radius:3px;background:${box.color}14"></div>`);
	const badges = overlay.badges.map((badge) => `<div style="position:absolute;left:${px(badge.x)};top:${px(badge.y)};min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:${badge.color};color:#fff;font:700 11px/18px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 1.5px #fff">${Math.trunc(badge.number)}</div>`);
	return `<div style="position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none">${boxes.join("")}${badges.join("")}</div>`;
}
// src/cli/report.ts
var ansi = (open, close) => (text) => `\u001b[${open}m${text}\u001b[${close}m`;
var COLOR = {
	red: ansi(31, 39),
	yellow: ansi(33, 39),
	blue: ansi(34, 39),
	green: ansi(32, 39),
	dim: ansi(2, 22),
	bold: ansi(1, 22)
};
var same = (text) => text;
var PLAIN = {
	red: same,
	yellow: same,
	blue: same,
	green: same,
	dim: same,
	bold: same
};
/** Colours only on a terminal, and never when NO_COLOR is set. */
function pickStyle(isTTY, env) {
	return isTTY && env.NO_COLOR === void 0 ? COLOR : PLAIN;
}
var SYMBOLS = {
	error: "✖",
	warn: "⚠",
	info: "ℹ"
};
var plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
function paint(style, severity, text) {
	return severity === "error" ? style.red(text) : severity === "warn" ? style.yellow(text) : style.blue(text);
}
function formatDpr(dpr) {
	return `@${Math.round(dpr * 1e3) / 1e3}x`;
}
/**
* Splits the report so each issue is listed once: issues on all devices,
* then issues shared by a subset of devices, then each device's own issues.
* Relies on issue numbers being the same for the same issue on every device.
*/
function issueSections(report) {
	const { devices } = report;
	const holders = /* @__PURE__ */ new Map();
	devices.forEach((device, index) => {
		for (const issue of device.issues) {
			const list = holders.get(issue.number) ?? [];
			if (!list.includes(index)) list.push(index);
			holders.set(issue.number, list);
		}
	});
	const groups = /* @__PURE__ */ new Map();
	for (const [number, indexes] of [...holders.entries()].sort((a, b) => a[0] - b[0])) {
		if (indexes.length < 2) continue;
		const signature = indexes.join(",");
		const group = groups.get(signature) ?? {
			indexes,
			numbers: []
		};
		group.numbers.push(number);
		groups.set(signature, group);
	}
	return {
		shared: [...groups.values()].sort((a, b) => b.indexes.length - a.indexes.length || (a.numbers[0] ?? 0) - (b.numbers[0] ?? 0)).map(({ indexes, numbers }) => {
			const members = indexes.flatMap((index) => devices[index] ? [devices[index]] : []);
			const first = members[0];
			const names = members.map((device) => `${device.name}${device.orientation === "landscape" ? " landscape" : ""}`);
			return {
				title: indexes.length === devices.length ? `On all ${devices.length} devices` : `On ${indexes.length} devices: ${names.join(", ")}`,
				devices: members,
				issues: first ? first.issues.filter((issue) => numbers.includes(issue.number)) : []
			};
		}),
		own: devices.map((device) => device.issues.filter((issue) => (holders.get(issue.number)?.length ?? 0) < 2))
	};
}
/** "iPhone 16 Pro  402×874 @3x" (+ "landscape"). */
function deviceLabel(device) {
	const turned = device.orientation === "landscape" ? " landscape" : "";
	return `${device.name}${turned}  ${device.viewport.width}×${device.viewport.height} ${formatDpr(device.dpr)}`;
}
function countsText(counts, style) {
	const parts = [];
	if (counts.errors) parts.push(style.red(`${SYMBOLS.error} ${plural(counts.errors, "error", "errors")}`));
	if (counts.warnings) parts.push(style.yellow(`${SYMBOLS.warn} ${plural(counts.warnings, "warning", "warnings")}`));
	if (counts.infos) parts.push(style.blue(`${SYMBOLS.info} ${plural(counts.infos, "note", "notes")}`));
	return parts.join("  ");
}
var isEmpty = (counts) => counts.errors + counts.warnings + counts.infos === 0;
/** "iPhone 16 Pro  402×874 @3x  ✖ 2 errors  ⚠ 3 warnings" */
function deviceHeader(device, style = PLAIN) {
	const counts = countIssues(device.issues);
	const text = isEmpty(counts) ? style.green("✓ no problems") : countsText(counts, style);
	return `${style.bold(device.name)}${device.orientation === "landscape" ? " landscape" : ""}  ${device.viewport.width}×${device.viewport.height} ${formatDpr(device.dpr)}  ${text}`;
}
/** "1. ✖ horizontal-overflow  div.hero > img  sticks out 118px past the right edge" */
function issueLine(issue, style = PLAIN) {
	const head = paint(style, issue.severity, `${SYMBOLS[issue.severity]} ${issue.rule}`);
	const detail = issue.detail ? style.dim(`  "${issue.detail}"`) : "";
	return `${issue.number}. ${head}  ${issue.selector}  ${issue.message}${detail}`;
}
function isClean(summary) {
	return summary.errors === 0 && summary.warnings === 0;
}
/** The text printed at the end of a check: short by default, everything with --all. */
function formatHuman(report, style = PLAIN, options = { all: false }) {
	const lines = [];
	const hinted = /* @__PURE__ */ new Set();
	const shown = (issues) => issues.filter((issue) => options.all || issue.severity !== "info");
	const list = (issues) => {
		const visible = shown(issues);
		const limit = options.all ? visible.length : 10;
		for (const issue of visible.slice(0, limit)) {
			lines.push(`  ${issueLine(issue, style)}`);
			if (issue.severity !== "info" && !hinted.has(issue.rule)) {
				hinted.add(issue.rule);
				lines.push(style.dim(`     Fix: ${issue.hint}`));
			}
		}
		if (visible.length > limit) lines.push(style.dim(`  … and ${visible.length - limit} more, see report.html`));
		return visible.length;
	};
	const count = report.devices.length;
	const sections = issueSections(report);
	for (const section of sections.shared) {
		if (shown(section.issues).length === 0) continue;
		lines.push(`${style.bold(section.title)}  ${countsText(countIssues(section.issues), style)}`);
		list(section.issues);
		lines.push("");
	}
	report.devices.forEach((device, index) => {
		lines.push(deviceHeader(device, style));
		list(sections.own[index] ?? []);
	});
	lines.push("");
	const { summary } = report;
	const failedStatus = report.devices.find((device) => device.status !== null && device.status >= 400)?.status;
	if (failedStatus) {
		lines.push(style.yellow(`${SYMBOLS.warn} The page answered HTTP ${failedStatus}, so this checked an error page.`));
		lines.push(style.dim(`  Fix the page or the URL, then run: ${RUN} check ${report.url}`));
	}
	if (isClean(summary)) lines.push(style.green(`✓ No responsive problems found on ${plural(count, "device", "devices")}`));
	else {
		lines.push(`Checked ${plural(count, "device", "devices")}: ${countsText(summary, style)}`);
		lines.push(style.dim("Fix the errors and warnings above, then run the same command again."));
	}
	if (!options.all && summary.infos > 0) lines.push(style.dim(`${plural(summary.infos, "note", "notes")} (44px tap targets, large images) not shown: add --all or open the report.`));
	lines.push(`Report: ${report.reportHtml}`);
	return lines.join("\n");
}
function markdownIssue(issue) {
	const detail = issue.detail ? ` (${issue.detail.replace(/`/g, "'")})` : "";
	const examples = issue.examples.length ? `\n   Examples: ${issue.examples.map((example) => `\`${example.replace(/`/g, "'")}\``).join(", ")}` : "";
	return [`${issue.number}. **${issue.severity}** \`${issue.rule}\` \`${issue.selector.replace(/`/g, "'")}\`: ${issue.message}${detail}${examples}`, `   Fix: ${issue.hint}`];
}
/** Markdown for pasting into an AI chat; image links are relative to the report folder. */
function toMarkdown(report) {
	const { summary } = report;
	const lines = [
		"# Phone Sim responsive check",
		"",
		`- URL: ${report.url}`,
		`- Checked: ${report.checkedAt} with ${report.tool.name} ${report.tool.version}`,
		`- Result: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.infos} notes on ${report.devices.length} devices`,
		`- Note: ${report.viewportNote}`,
		""
	];
	const sections = issueSections(report);
	if (sections.shared.length > 0) lines.push("Issue numbers are the same on every screenshot.", "");
	for (const section of sections.shared) {
		lines.push(`## ${section.title}`, "");
		for (const issue of section.issues) lines.push(...markdownIssue(issue));
		lines.push("");
	}
	report.devices.forEach((device, index) => {
		lines.push(`## ${deviceLabel(device)}`, "");
		lines.push(`![${device.name}](${encodeURI(basename(device.screenshot))})`, "");
		const own = sections.own[index] ?? [];
		if (device.issues.length === 0) lines.push("No problems found.");
		else if (own.length === 0) lines.push("Only the shared issues above.");
		for (const issue of own) lines.push(...markdownIssue(issue));
		lines.push("");
	});
	return lines.join("\n");
}
function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function htmlIssue(issue) {
	const color = SEVERITY_COLORS[issue.severity];
	const detail = issue.detail ? `<div class="detail">${escapeHtml(issue.detail)}</div>` : "";
	const examples = issue.examples.length ? `<div class="detail">e.g. ${issue.examples.map((example) => `<code>${escapeHtml(example)}</code>`).join(" ")}</div>` : "";
	return `<li><span class="badge" style="background:${color}">${issue.number}</span><div><div class="head"><span class="rule" style="color:${color}">${escapeHtml(issue.rule)}</span> <code>${escapeHtml(issue.selector)}</code></div><div>${escapeHtml(issue.message)}</div>${detail}${examples}<div class="hint">Fix: ${escapeHtml(issue.hint)}</div></div></li>`;
}
function htmlCounts(counts) {
	if (isEmpty(counts)) return "<span class=\"ok\">✓ no problems</span>";
	return [
		counts.errors ? `<span style="color:${SEVERITY_COLORS.error}">✖ ${plural(counts.errors, "error", "errors")}</span>` : "",
		counts.warnings ? `<span style="color:${SEVERITY_COLORS.warn}">⚠ ${plural(counts.warnings, "warning", "warnings")}</span>` : "",
		counts.infos ? `<span style="color:${SEVERITY_COLORS.info}">ℹ ${plural(counts.infos, "note", "notes")}</span>` : ""
	].filter(Boolean).join(" ");
}
function htmlDevice(device, own) {
	const image = escapeHtml(encodeURI(basename(device.screenshot)));
	const raw = escapeHtml(encodeURI(basename(device.rawScreenshot)));
	const list = own.length > 0 ? `<ol>${own.map(htmlIssue).join("")}</ol>` : device.issues.length > 0 ? "<p class=\"note\">Only the shared issues above.</p>" : "<p class=\"ok\">Looks good on this screen.</p>";
	const sharedCount = device.issues.length - own.length;
	const sharedNote = sharedCount > 0 ? ` · plus ${plural(sharedCount, "shared issue", "shared issues")} above` : "";
	return `<section class="device"><a class="shot" href="${raw}" title="Open the plain screenshot"><img src="${image}" alt="${escapeHtml(device.name)} screenshot" loading="lazy"></a><div class="info"><h2>${escapeHtml(device.name)}${device.orientation === "landscape" ? " <small>landscape</small>" : ""}</h2><div class="meta">${device.viewport.width}×${device.viewport.height} ${formatDpr(device.dpr)} · ${htmlCounts(countIssues(device.issues))}${sharedNote}</div>${list}</div></section>`;
}
/** One self-contained page: inline CSS, screenshots by relative path. */
function toHtml(report) {
	const { summary } = report;
	const verdict = isClean(summary) ? `<p class="verdict ok">✓ No responsive problems found on ${plural(report.devices.length, "device", "devices")}</p>` : `<p class="verdict">${summary.errors} errors · ${summary.warnings} warnings · ${summary.infos} notes on ${plural(report.devices.length, "device", "devices")}</p>`;
	const failedStatus = report.devices.find((device) => device.status !== null && device.status >= 400)?.status;
	const statusNote = failedStatus ? `<p class="verdict" style="color:${SEVERITY_COLORS.warn}">⚠ The page answered HTTP ${failedStatus}, so this checked an error page.</p>` : "";
	const sections = issueSections(report);
	const sharedSection = sections.shared.map((section) => `<section class="shared"><h2>${escapeHtml(section.title)} <small>same number on every screenshot</small></h2><div class="meta">${htmlCounts(countIssues(section.issues))}</div><ol>${section.issues.map(htmlIssue).join("")}</ol></section>`).join("\n");
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Phone Sim check</title>
<style>
:root{color-scheme:light dark;--bg:#f6f6f4;--card:#fff;--text:#1b1b1d;--muted:#6b6b70;--line:#e4e4e0}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--card:#1d1d20;--text:#ececef;--muted:#9a9aa2;--line:#2c2c31}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
header{padding:24px 24px 8px}
h1{margin:0;font-size:22px}
.url{color:var(--muted);word-break:break-all}
.verdict{font-size:17px;font-weight:600;margin:8px 0 0}
.ok{color:#1f9d55}
.note{color:var(--muted);font-size:13px;margin:4px 0 0}
main{display:flex;flex-wrap:wrap;gap:20px;padding:16px 24px 40px;align-items:flex-start}
.shared,.device{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.shared{flex:1 1 100%}
.shared ol{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.device{display:flex;gap:16px;flex:1 1 560px;max-width:900px}
.shot{flex:none}
.shot img{display:block;max-height:640px;max-width:300px;width:auto;height:auto}
.info{min-width:0;flex:1}
h2{margin:0;font-size:17px}
h2 small{font-weight:400;color:var(--muted);font-size:13px}
.meta{color:var(--muted);font-size:13px;margin-bottom:8px}
ol{list-style:none;margin:0;padding:0;display:grid;gap:10px}
li{display:flex;gap:10px;font-size:14px}
.badge{flex:none;min-width:22px;height:22px;border-radius:11px;color:#fff;font-weight:700;font-size:12px;line-height:22px;text-align:center;padding:0 5px}
.head{font-weight:600}
code{font:12.5px ui-monospace,SFMono-Regular,Menlo,monospace;background:color-mix(in srgb,var(--text) 8%,transparent);padding:1px 5px;border-radius:5px;overflow-wrap:anywhere}
.detail{color:var(--muted);font-size:13px;word-break:break-word}
.hint{font-size:13px}
@media (max-width:640px){header{padding:16px 16px 4px}main{padding:12px 16px 32px}.device{flex-direction:column}.shot img{max-width:100%}.shared ol{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
<h1>Phone Sim responsive check</h1>
<div class="url">${escapeHtml(report.url)} · ${escapeHtml(report.checkedAt)}</div>
${statusNote}${verdict}
<p class="note">${escapeHtml(report.viewportNote)} Click a screenshot for the plain version.</p>
</header>
<main>
${sharedSection}
${report.devices.map((device, index) => htmlDevice(device, sections.own[index] ?? [])).join("\n")}
</main>
</body>
</html>
`;
}
// src/devices/userAgent.ts
/**
* Safari 26 froze the OS token in its User-Agent at 18_6, while the Safari
* version keeps moving. Earlier versions report the real OS version.
*/
var FROZEN_IOS_TOKEN = "18_6";
var FIRST_FROZEN_IOS_MAJOR = 26;
function appleVersion(osVersion) {
	const [majorText = "18", minorText = "0"] = osVersion.split(".");
	const major = Number.parseInt(majorText, 10);
	const minor = Number.parseInt(minorText, 10);
	const safeMajor = Number.isInteger(major) ? major : 18;
	const safeMinor = Number.isInteger(minor) ? minor : 0;
	return {
		os: safeMajor >= FIRST_FROZEN_IOS_MAJOR ? FROZEN_IOS_TOKEN : `${safeMajor}_${safeMinor}`,
		safari: `${safeMajor}.${safeMinor}`
	};
}
/** Phones and foldables are "mobile"; tablets get desktop-class or tablet pages. */
function isMobileDevice(device) {
	return device.kind !== "tablet";
}
/** The User-Agent a real browser on this device sends. */
function buildUserAgent(device, chromeMajor) {
	if (device.userAgent) return device.userAgent;
	switch (device.platform) {
		case "ios": {
			const version = appleVersion(device.osVersion);
			return `Mozilla/5.0 (iPhone; CPU iPhone OS ${version.os} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version.safari} Mobile/15E148 Safari/604.1`;
		}
		case "ipados": return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${appleVersion(device.osVersion).safari} Safari/605.1.15`;
		case "android": return `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 ${isMobileDevice(device) ? "Mobile " : ""}Safari/537.36`;
	}
}
var CLIENT_HINT_PLATFORM = {
	android: "\"Android\"",
	ios: "\"iOS\"",
	ipados: "\"macOS\""
};
function clientHints(device) {
	return {
		mobile: isMobileDevice(device) ? "?1" : "?0",
		platform: CLIENT_HINT_PLATFORM[device.platform]
	};
}
// src/devices/layout.ts
function defaultButtons(device) {
	if (device.kind === "tablet") return "tablet";
	if (device.platform !== "android") return "iphone-switch";
	if (device.brand === "Samsung") return "samsung";
	if (device.brand === "Google") return "pixel";
	return "android";
}
function defaultRim(device) {
	if (device.frame.cutout === "home-button") return 3;
	return device.kind === "tablet" ? 3 : 3.5;
}
function frameStyle(device) {
	const { frame } = device;
	return {
		edge: frame.edge ?? "rounded",
		rim: Math.min(frame.rim ?? defaultRim(device), Math.max(1, frame.bezel - 1)),
		chin: frame.chin ?? 0,
		antennaBands: frame.antennaBands ?? false,
		buttons: frame.buttons ?? defaultButtons(device),
		hinge: frame.hinge ?? (frame.crease ? "center" : null)
	};
}
/** Height of the status bar strip reserved at the top of the screen, portrait. */
var STATUS_BAR_HEIGHT = {
	"dynamic-island": 54,
	notch: 44,
	"punch-hole-center": 28,
	"punch-hole-left": 28,
	waterdrop: 28,
	"home-button": 20,
	none: 24
};
var isLandscapePhone = (device, orientation) => orientation === "landscape" && device.kind !== "tablet";
/** Phones and foldables hide the status bar in landscape (as iOS does); tablets keep it. */
function statusBarHeight(device, orientation) {
	if (isLandscapePhone(device, orientation)) return 0;
	return STATUS_BAR_HEIGHT[device.frame.cutout];
}
/** Bezels in portrait. Home-button devices get a tall forehead and chin; `chin` adds to the bottom. */
function bezels(device) {
	const { bezel, cutout } = device.frame;
	const chin = frameStyle(device).chin;
	if (cutout !== "home-button") return {
		top: bezel,
		bottom: bezel + chin,
		side: bezel
	};
	const ratio = device.kind === "tablet" ? .115 : .15;
	const forehead = Math.max(bezel, Math.round(device.screen.height * ratio));
	return {
		top: forehead,
		bottom: forehead + chin,
		side: bezel
	};
}
/** Outer corner radius of the body. */
function bodyRadius(device) {
	if (device.frame.cutout === "home-button") {
		const ratio = device.kind === "tablet" ? .05 : .15;
		return Math.round(device.screen.width * ratio);
	}
	return device.frame.screenRadius + device.frame.bezel;
}
function rotateSize(size, orientation) {
	return orientation === "portrait" ? {
		width: size.width,
		height: size.height
	} : {
		width: size.height,
		height: size.width
	};
}
var metal = (edge, start, length) => ({
	edge,
	start,
	length,
	variant: "metal"
});
var IPHONE_LEFT = [metal("left", .235, .065), metal("left", .32, .065)];
/** Buttons per family, placed where the real ones are. */
function sideButtons(device) {
	switch (frameStyle(device).buttons) {
		case "iphone-switch": return [
			metal("left", .165, .035),
			...IPHONE_LEFT,
			metal("right", .265, .1)
		];
		case "iphone-action": return [
			metal("left", .17, .03),
			...IPHONE_LEFT,
			metal("right", .265, .1)
		];
		case "iphone-camera-control": return [
			metal("left", .17, .03),
			...IPHONE_LEFT,
			metal("right", .265, .1),
			{
				edge: "right",
				start: .6,
				length: .075,
				variant: "camera-control"
			}
		];
		case "samsung": return [metal("right", .22, .11), metal("right", .36, .06)];
		case "pixel": return [metal("right", .19, .06), metal("right", .28, .11)];
		case "android": return [metal("right", .2, .12), metal("right", .36, .07)];
		case "tablet": return [
			metal("top", .8, .06),
			metal("right", .07, .05),
			metal("right", .13, .05)
		];
	}
}
/** Size of the cutout drawn at the top of the portrait screen (0×0 when there is none). */
function cutoutSize(device) {
	switch (device.frame.cutout) {
		case "dynamic-island": return {
			width: 124,
			height: 36
		};
		case "notch": return {
			width: Math.round(device.screen.width * (device.frame.screenRadius >= 44 ? .42 : .55)),
			height: 30
		};
		case "punch-hole-center":
		case "punch-hole-left": return {
			width: 12,
			height: 12
		};
		case "waterdrop": return {
			width: 40,
			height: 22
		};
		case "home-button":
		case "none": return {
			width: 0,
			height: 0
		};
	}
}
// src/cli/emulate.ts
/**
* Every catalog device honours the viewport meta tag, iPads included: iPadOS
* Safari sends a Mac User-Agent (desktop sites) but still lays pages out by
* the tag, and zooms wider pages out to fit. Playwright's `isMobile` is that
* switch, so it is on for all devices; the Mac User-Agent stays for iPads.
*/
function emulatesMobile(_device) {
	return true;
}
/** iPad Safari: desktop-class browsing (desktop sites, Mac User-Agent). */
function isDesktopClass(device) {
	return device.platform === "ipados";
}
/**
* Browser-context options for one device. The viewport is the full screen size
* (no toolbar subtracted): widths are exact, heights are a little taller than
* a real browser's visible area.
*/
function emulationFor(device, orientation, chromeMajor) {
	const size = rotateSize(device.screen, orientation);
	const hints = clientHints(device);
	return {
		viewport: size,
		screen: size,
		deviceScaleFactor: device.dpr,
		isMobile: emulatesMobile(device),
		hasTouch: true,
		userAgent: buildUserAgent(device, chromeMajor),
		locale: "en-US",
		extraHTTPHeaders: {
			"sec-ch-ua-mobile": hints.mobile,
			"sec-ch-ua-platform": hints.platform
		}
	};
}
var NO_INSETS = {
	top: 0,
	bottom: 0,
	left: 0,
	right: 0
};
/** Whether something covers part of the screen edge (camera cutout). */
function hasScreenCutout(device) {
	const { cutout } = device.frame;
	return cutout !== "none" && cutout !== "home-button";
}
/** Home indicator height on gesture iPhones and iPads (iOS draws it over the page). */
var HOME_INDICATOR = 34;
var IPAD_HOME_INDICATOR = 20;
/**
* env(safe-area-inset-*) values the device reports when the page uses
* viewport-fit=cover. The top inset is the status bar height used by the frame.
*/
function safeAreaInsets(device, orientation) {
	const homeBar = device.platform === "ipados" ? IPAD_HOME_INDICATOR : device.platform === "ios" ? HOME_INDICATOR : 0;
	const bottom = device.frame.cutout === "home-button" ? 0 : homeBar;
	if (orientation === "portrait") return {
		...NO_INSETS,
		top: statusBarHeight(device, "portrait"),
		bottom
	};
	if (device.kind === "tablet") return {
		...NO_INSETS,
		top: statusBarHeight(device, "landscape"),
		bottom
	};
	const side = hasScreenCutout(device) ? statusBarHeight(device, "portrait") : 0;
	return {
		top: 0,
		bottom: bottom > 0 ? 21 : 0,
		left: side,
		right: device.platform === "ios" ? side : 0
	};
}
/** Chrome major version from Playwright's `browser.version()` ("140.0.7339.16"). */
function chromeMajorFrom(version, fallback) {
	const major = Number.parseInt(version, 10);
	return Number.isInteger(major) && major > 0 ? major : fallback;
}
// src/cli/frame.ts
var DOCUMENT_START = "<!doctype html><html><head><meta charset=\"utf-8\"><style>html,body{margin:0;padding:0;background:transparent}#device{position:relative}</style></head><body>";
/** The screenshot with its overlay only (for --no-frame). */
function screenHtml(input) {
	const width = Math.round(input.content.width);
	const height = Math.round(input.content.height);
	return [
		DOCUMENT_START,
		`<div id="device" style="width:${width}px;height:${height}px;overflow:hidden">`,
		`<img alt="" src="${input.image}" style="position:absolute;left:0;top:0;display:block;width:${width}px;height:${height}px">`,
		input.overlay ? overlayHtml(input.overlay) : "",
		"</div></body></html>"
	].join("");
}
var SAFE_COLOR = /^[#a-z0-9(),.%\s-]+$/i;
var DEFAULT_COLOR = "#1d1d1f";
function safeColor(color) {
	return SAFE_COLOR.test(color) ? color : DEFAULT_COLOR;
}
function portraitBody(device) {
	const edges = bezels(device);
	return {
		width: device.screen.width + edges.side * 2,
		height: device.screen.height + edges.top + edges.bottom
	};
}
function frameGeometry(device, orientation, content) {
	const edges = bezels(device);
	const baseScreen = rotateSize(device.screen, orientation);
	const extra = Math.max(0, Math.round(content.height) - baseScreen.height);
	const baseBody = rotateSize(portraitBody(device), orientation);
	const screen = orientation === "portrait" ? {
		x: edges.side,
		y: edges.top,
		width: baseScreen.width,
		height: baseScreen.height + extra
	} : {
		x: edges.top,
		y: edges.side,
		width: baseScreen.width,
		height: baseScreen.height + extra
	};
	const body = {
		x: 3,
		y: 3,
		width: baseBody.width,
		height: baseBody.height + extra
	};
	return {
		outer: {
			width: body.width + 6,
			height: body.height + 6
		},
		body,
		screen,
		extra
	};
}
/** Maps a rect drawn on the upright item (width `uprightWidth`) to the current orientation. */
function orient(rect, orientation, uprightWidth) {
	if (orientation === "portrait") return rect;
	return {
		x: rect.y,
		y: uprightWidth - rect.x - rect.width,
		width: rect.height,
		height: rect.width
	};
}
function box(shape) {
	const r = (value) => Math.round(value * 100) / 100;
	return `<div style="position:absolute;left:${r(shape.x)}px;top:${r(shape.y)}px;width:${r(shape.width)}px;height:${r(shape.height)}px;${shape.style}"></div>`;
}
/** Camera cutout shapes in upright screen coordinates. */
function cutoutShapes(device) {
	const { width, height } = cutoutSize(device);
	const screenWidth = device.screen.width;
	const center = (screenWidth - width) / 2;
	switch (device.frame.cutout) {
		case "dynamic-island": return [{
			x: center,
			y: 11,
			width,
			height,
			style: `background:#000;border-radius:${height / 2}px`
		}];
		case "notch": return [{
			x: center,
			y: 0,
			width,
			height,
			style: "background:#000;border-radius:0 0 20px 20px"
		}];
		case "punch-hole-center": return [{
			x: center,
			y: 9,
			width,
			height,
			style: "background:#000;border-radius:50%"
		}];
		case "punch-hole-left": return [{
			x: 18,
			y: 9,
			width,
			height,
			style: "background:#000;border-radius:50%"
		}];
		case "waterdrop": return [{
			x: (screenWidth - 22) / 2,
			y: 0,
			width: 22,
			height: 20,
			style: "background:#000;border-radius:0 0 11px 11px"
		}];
		case "home-button":
		case "none": return [];
	}
}
/** What hides parts of the screenshot once framed: rounded corners and the camera cutout (screen coordinates). */
function screenObstacles(device, orientation) {
	return {
		cornerRadius: device.frame.screenRadius,
		avoid: cutoutShapes(device).map(({ x, y, width, height }) => orient({
			x,
			y,
			width,
			height
		}, orientation, device.screen.width))
	};
}
/** Side buttons, home button and earpiece in upright body coordinates. */
function hardwareShapes(device, color) {
	const body = portraitBody(device);
	const edges = bezels(device);
	const behind = sideButtons(device).map((button) => {
		const along = button.edge === "top" ? body.width : body.height;
		const start = button.start * along;
		const length = button.length * along;
		const look = button.variant === "camera-control" ? "background:#2a2a2e;border-radius:2px" : `background:${color};filter:brightness(0.8);border-radius:2px`;
		const thickness = 5;
		if (button.edge === "left") return {
			x: -3,
			y: start,
			width: thickness,
			height: length,
			style: look
		};
		if (button.edge === "right") return {
			x: body.width - 2,
			y: start,
			width: thickness,
			height: length,
			style: look
		};
		return {
			x: start,
			y: -3,
			width: length,
			height: thickness,
			style: look
		};
	});
	const front = [];
	if (device.frame.cutout === "home-button") {
		const diameter = Math.round(Math.min(edges.bottom * .6, device.screen.width * .17));
		front.push({
			x: (body.width - diameter) / 2,
			y: edges.top + device.screen.height + (edges.bottom - diameter) / 2,
			width: diameter,
			height: diameter,
			style: "border-radius:50%;background:#0b0b0d;box-shadow:inset 0 0 0 2px rgba(160,160,170,0.35)"
		});
		const slit = Math.round(device.screen.width * .14);
		front.push({
			x: (body.width - slit) / 2,
			y: edges.top / 2 - 2,
			width: slit,
			height: 5,
			style: "border-radius:3px;background:#1b1c20"
		});
		front.push({
			x: body.width / 2 - slit / 2 - 18,
			y: edges.top / 2 - 4,
			width: 9,
			height: 9,
			style: "border-radius:50%;background:#101018"
		});
	}
	return {
		behind,
		front
	};
}
/** Full HTML document with the framed screenshot in `#device`. */
function frameHtml(input) {
	const { device, orientation } = input;
	const geometry = frameGeometry(device, orientation, input.content);
	const { body, screen, extra } = geometry;
	const color = safeColor(device.frame.color);
	const rim = frameStyle(device).rim;
	const radius = bodyRadius(device);
	const uprightBodyWidth = portraitBody(device).width;
	const baseScreenBottom = screen.y + screen.height - extra;
	/** Upright body shape → current orientation; things below the real screen move down with a full-page extension. */
	const place = (shape) => {
		const rect = orient(shape, orientation, uprightBodyWidth);
		return {
			...rect.y >= baseScreenBottom ? {
				...rect,
				y: rect.y + extra
			} : rect,
			style: shape.style
		};
	};
	const hardware = hardwareShapes(device, color);
	const cutouts = cutoutShapes(device).map((shape) => ({
		...orient(shape, orientation, device.screen.width),
		style: shape.style
	}));
	const glassRadius = Math.max(0, radius - rim);
	const parts = [
		...hardware.behind.map(place).map(box),
		`<div style="position:absolute;left:0;top:0;width:${body.width}px;height:${body.height}px;border-radius:${radius}px;background:linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0) 35%,rgba(0,0,0,0.22) 100%),${color};box-shadow:0 0 0 0.5px rgba(0,0,0,0.5)">`,
		`<div style="position:absolute;inset:${rim}px;border-radius:${glassRadius}px;background:#050506;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06)"></div>`,
		...hardware.front.map(place).map(box),
		`<div style="position:absolute;left:${screen.x}px;top:${screen.y}px;width:${screen.width}px;height:${screen.height}px;border-radius:${device.frame.screenRadius}px;overflow:hidden;background:#000">`,
		`<img alt="" src="${input.image}" style="position:absolute;left:0;top:0;display:block;width:${Math.round(input.content.width)}px;height:${Math.round(input.content.height)}px">`,
		input.overlay ? overlayHtml(input.overlay) : "",
		...cutouts.map(box),
		`<div style="position:absolute;inset:0;border-radius:${device.frame.screenRadius}px;border:1px solid #000"></div>`,
		"</div>",
		"</div>"
	];
	return [
		DOCUMENT_START,
		`<div id="device" style="width:${geometry.outer.width}px;height:${geometry.outer.height}px">`,
		`<div style="position:absolute;left:${body.x}px;top:${body.y}px;width:${body.width}px;height:${body.height}px">`,
		...parts,
		"</div></div></body></html>"
	].join("");
}
// src/cli/pool.ts
/** Runs `task` over `items` with at most `limit` running at once; results keep the input order. */
async function mapLimit(items, limit, task) {
	const results = new Array(items.length);
	let next = 0;
	const worker = async () => {
		while (next < items.length) {
			const index = next;
			next += 1;
			results[index] = await task(items[index], index);
		}
	};
	const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker);
	await Promise.all(workers);
	return results;
}
// src/cli/rules.ts
function collectIssues(options) {
	const issues = [];
	const body = document.body;
	const root = document.documentElement;
	if (!body) return issues;
	const vw = root.clientWidth || window.innerWidth;
	const vh = root.clientHeight || window.innerHeight;
	const sx = window.scrollX;
	const sy = window.scrollY;
	const styles = /* @__PURE__ */ new Map();
	function styleOf(el) {
		let style = styles.get(el);
		if (!style) {
			style = getComputedStyle(el);
			styles.set(el, style);
		}
		return style;
	}
	const rects = /* @__PURE__ */ new Map();
	function rectOf(el) {
		let rect = rects.get(el);
		if (!rect) {
			rect = el.getBoundingClientRect();
			rects.set(el, rect);
		}
		return rect;
	}
	/** A clip that leaves (almost) nothing visible: the "sr-only" / "visually-hidden" pattern. */
	function clipsToNothing(el) {
		const style = styleOf(el);
		if (style.clip && style.clip.startsWith("rect(")) {
			const [top, right, bottom, left] = (style.clip.match(/-?[\d.]+/g) ?? []).map(Number);
			if (top !== void 0 && right !== void 0 && bottom !== void 0 && left !== void 0) {
				if (right - left <= 2 || bottom - top <= 2) return true;
			}
		}
		if (/inset\(\s*(50|100)%/.test(style.clipPath)) return true;
		if (style.overflowX !== "visible" || style.overflowY !== "visible") {
			const rect = rectOf(el);
			if (rect.width <= 2 || rect.height <= 2) return true;
		}
		return false;
	}
	const hiddenTrees = /* @__PURE__ */ new Map();
	/** Inside a screen-reader-only ancestor. */
	function insideHidden(el) {
		const parent = el.parentElement;
		if (!parent || parent === body || parent === root) return false;
		const cached = hiddenTrees.get(parent);
		if (cached !== void 0) return cached;
		const hidden = clipsToNothing(parent) || insideHidden(parent);
		hiddenTrees.set(parent, hidden);
		return hidden;
	}
	/** Visually hidden on purpose (screen-reader-only text, skip links before focus). */
	function visuallyHidden(el, rect) {
		return rect.width <= 2 || rect.height <= 2 || clipsToNothing(el) || insideHidden(el);
	}
	function isVisible(el, rect) {
		if (rect.width <= 0 || rect.height <= 0) return false;
		if (typeof el.checkVisibility === "function") {
			if (!el.checkVisibility({
				opacityProperty: true,
				visibilityProperty: true
			})) return false;
		} else {
			const style = styleOf(el);
			if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
		}
		return !visuallyHidden(el, rect);
	}
	function toRect(rect) {
		return {
			x: Math.round(rect.left + sx),
			y: Math.round(rect.top + sy),
			width: Math.round(rect.width),
			height: Math.round(rect.height)
		};
	}
	function looksGenerated(name) {
		return name.startsWith("css-") || name.startsWith("sc-") || /\d/.test(name) && name.length > 12;
	}
	function uniqueId(el) {
		if (!el.id || looksGenerated(el.id)) return null;
		const selector = `#${CSS.escape(el.id)}`;
		return document.querySelectorAll(selector).length === 1 ? selector : null;
	}
	function part(el, withNth) {
		let text = el.tagName.toLowerCase() + Array.from(el.classList).filter((name) => !looksGenerated(name)).slice(0, 2).map((name) => `.${CSS.escape(name)}`).join("");
		const parent = el.parentElement;
		if (withNth && parent) {
			const same = Array.from(parent.children).filter((child) => child.tagName === el.tagName);
			if (same.length > 1) text += `:nth-of-type(${same.indexOf(el) + 1})`;
		}
		return text;
	}
	function selectorOf(el, withNth) {
		const own = uniqueId(el);
		if (own) return own;
		const parts = [];
		let current = el;
		while (current && current !== root && parts.length < 3) {
			const id = parts.length > 0 ? uniqueId(current) : null;
			if (id) {
				parts.unshift(id);
				break;
			}
			parts.unshift(part(current, withNth));
			if (current === body) break;
			current = current.parentElement;
		}
		return parts.join(" > ");
	}
	/** Tag plus up to 2 stable classes: no ids, no positions. */
	function shapeOf(el) {
		return part(el, false);
	}
	/** Group key: the element's shape and its parent's, so every footnote link or nav item groups together. */
	function groupKeyOf(el) {
		const parent = el.parentElement;
		return parent && parent !== root ? `${shapeOf(parent)} > ${shapeOf(el)}` : shapeOf(el);
	}
	function textOf(el) {
		const clean = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("alt") || el.getAttribute("placeholder") || el.getAttribute("title") || el.getAttribute("name") || "").replace(/\s+/g, " ").trim();
		return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
	}
	function hasOwnText(el) {
		for (const node of Array.from(el.childNodes)) if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "") return true;
		return false;
	}
	function push(el, rule, severity, message, value, rect, detail) {
		issues.push({
			rule,
			severity,
			selector: el ? selectorOf(el, true) : "html",
			groupKey: el ? groupKeyOf(el) : "html",
			message,
			detail: detail ?? (el ? textOf(el) : ""),
			rect: rect ? toRect(rect) : null,
			value
		});
	}
	const SKIP_TAGS = /* @__PURE__ */ new Set([
		"SCRIPT",
		"STYLE",
		"NOSCRIPT",
		"TEMPLATE",
		"HEAD",
		"META",
		"LINK",
		"TITLE",
		"BR",
		"WBR"
	]);
	const all = Array.from(body.querySelectorAll("*")).filter((el) => !SKIP_TAGS.has(el.tagName) && !(el instanceof SVGElement && el.tagName.toLowerCase() !== "svg"));
	const viewportContent = Array.from(document.querySelectorAll("meta[name=\"viewport\" i]")).map((meta) => meta.getAttribute("content") ?? "").join(",").toLowerCase().replace(/\s+/g, "");
	if (!/(^|,)width=device-width/.test(viewportContent)) {
		const missing = viewportContent ? `the viewport meta tag does not set width=device-width ("${viewportContent}")` : "no <meta name=\"viewport\"> tag";
		const message = options.desktopClass ? `${missing}: iPad Safari shows the page as a zoomed-out desktop site` : `${missing}: phones show the page zoomed out${viewportContent ? "" : " at 980px wide"}`;
		push(null, "viewport-meta", options.desktopClass ? "info" : "error", message, 1, null, "<head>");
	}
	const viewportFitCover = /viewport-fit=cover/.test(viewportContent);
	const pageWidth = Math.max(root.scrollWidth, body.scrollWidth);
	if (pageWidth > vw + 1) {
		const clips = /* @__PURE__ */ new Map();
		const clippedByAncestor = (el) => {
			const parent = el.parentElement;
			if (!parent || parent === body || parent === root) return false;
			const cached = clips.get(parent);
			if (cached !== void 0) return cached;
			const clipped = styleOf(parent).overflowX !== "visible" || clippedByAncestor(parent);
			clips.set(parent, clipped);
			return clipped;
		};
		const overBy = (rect) => ({
			right: rect.right - vw,
			left: -rect.left
		});
		const found = [];
		for (const el of all) {
			const rect = rectOf(el);
			if (rect.width <= 0) continue;
			const over = overBy(rect);
			const right = over.right > 1;
			const left = over.left > 1 && rect.right > 0;
			if (!right && !left) continue;
			if (styleOf(el).position === "fixed") continue;
			if (!el.checkVisibility({
				opacityProperty: true,
				visibilityProperty: true
			})) continue;
			if (clippedByAncestor(el) || visuallyHidden(el, rect)) continue;
			const side = right ? "right" : "left";
			const amount = right ? over.right : over.left;
			let parent = el.parentElement;
			while (parent && parent !== body && parent !== root && rectOf(parent).width === 0) parent = parent.parentElement;
			if (parent && parent !== body && parent !== root) {
				const parentOver = overBy(rectOf(parent));
				if ((side === "right" ? parentOver.right : parentOver.left) >= amount - 1) continue;
			}
			found.push({
				el,
				rect,
				amount,
				side
			});
		}
		found.sort((a, b) => b.amount - a.amount);
		const extra = Math.round(pageWidth - vw);
		for (const item of found.slice(0, Math.max(1, options.maxOverflow))) {
			const px = Math.round(item.amount);
			const where = item.side === "right" ? "sticks out" : "is cut off";
			push(item.el, "horizontal-overflow", "error", `${where} ${px}px past the ${item.side} edge (element is ${Math.round(item.rect.width)}px wide, screen is ${vw}px)`, px, item.rect, `${textOf(item.el) || "(no text)"} | page is ${extra}px wider than the screen`);
		}
		if (found.length === 0) push(null, "horizontal-overflow", "error", `the page is ${extra}px wider than the screen and scrolls sideways`, extra, null, "(cause not found)");
	}
	const TAP = "a[href], button, input:not([type=\"hidden\" i]), select, textarea, summary, [role=\"button\"], [role=\"link\"], [role=\"checkbox\"], [role=\"tab\"], [role=\"menuitem\"], [onclick], [tabindex]:not([tabindex=\"-1\"])";
	const textLength = (node) => (node.textContent ?? "").replace(/\s+/g, " ").trim().length;
	const proseLengths = /* @__PURE__ */ new Map();
	/** Text in a block that is not part of a link or button: long for a sentence, near zero for a nav. */
	const proseLength = (block) => {
		let length = proseLengths.get(block);
		if (length === void 0) {
			const controls = Array.from(block.querySelectorAll("a, button")).filter((control) => !control.parentElement?.closest("a, button"));
			length = Math.max(0, textLength(block) - controls.reduce((sum, control) => sum + textLength(control), 0));
			proseLengths.set(block, length);
		}
		return length;
	};
	/**
	* WCAG 2.5.8 inline exception: a link inside a sentence (also through inline
	* wrappers such as <sup>, <em>, <span>) cannot be made bigger without
	* breaking the text, so it is not a tap-target problem.
	*/
	const inRunningText = (el) => {
		if (styleOf(el).display !== "inline") return false;
		let block = el.parentElement;
		while (block && block !== body && styleOf(block).display === "inline") block = block.parentElement;
		if (!block) return false;
		if (el.closest("sup, sub")) return textLength(block) > textLength(el);
		return proseLength(block) >= 20;
	};
	const targets = [];
	const undersized = [];
	const appleHint = (el, rect) => {
		const width = Math.round(rect.width);
		const height = Math.round(rect.height);
		if (width < 44 || height < 44) push(el, "small-tap-target", "info", `is ${width}×${height}px; Apple recommends at least 44×44px`, Math.min(width, height), rect);
	};
	for (const el of Array.from(body.querySelectorAll(TAP))) {
		if (el.parentElement?.closest(TAP)) continue;
		const rect = rectOf(el);
		if (!isVisible(el, rect)) continue;
		targets.push({
			el,
			rect
		});
		if (el.tagName === "A" && inRunningText(el)) continue;
		if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
			if (Array.from(el.labels ?? []).some((label) => (label.textContent ?? "").trim() !== "")) continue;
		}
		if (rect.width < 24 || rect.height < 24) undersized.push({
			el,
			rect,
			cx: rect.left + rect.width / 2,
			cy: rect.top + rect.height / 2
		});
		else appleHint(el, rect);
	}
	const distanceToRect = (x, y, rect) => {
		const dx = Math.max(rect.left - x, 0, x - rect.right);
		const dy = Math.max(rect.top - y, 0, y - rect.bottom);
		return Math.hypot(dx, dy);
	};
	for (const small of undersized) {
		if (!(targets.some((other) => other.el !== small.el && distanceToRect(small.cx, small.cy, other.rect) < 12) || undersized.some((other) => other.el !== small.el && Math.hypot(other.cx - small.cx, other.cy - small.cy) < 24))) {
			appleHint(small.el, small.rect);
			continue;
		}
		const width = Math.round(small.rect.width);
		const height = Math.round(small.rect.height);
		push(small.el, "small-tap-target", "warn", `is ${width}×${height}px with another target within 24px; a finger needs 24×24px`, Math.min(width, height), small.rect);
	}
	for (const el of all) {
		if (!hasOwnText(el) || el.closest("sup, sub")) continue;
		const size = Number.parseFloat(styleOf(el).fontSize);
		if (!(size < 11.95)) continue;
		const rect = rectOf(el);
		if (!isVisible(el, rect)) continue;
		push(el, "small-text", "warn", `text is ${Math.round(size * 10) / 10}px, below the 12px minimum`, size, rect);
	}
	if (options.ios) {
		const NO_ZOOM = /* @__PURE__ */ new Set([
			"checkbox",
			"radio",
			"range",
			"color",
			"file",
			"submit",
			"button",
			"image",
			"reset",
			"hidden"
		]);
		for (const el of Array.from(body.querySelectorAll("input, select, textarea"))) {
			if (el instanceof HTMLInputElement && NO_ZOOM.has(el.type)) continue;
			const rect = rectOf(el);
			if (!isVisible(el, rect)) continue;
			const size = Number.parseFloat(styleOf(el).fontSize);
			if (!(size < 16)) continue;
			push(el, "ios-input-zoom", "warn", `font-size is ${Math.round(size * 10) / 10}px: iPhone Safari zooms the page in when it is tapped (needs 16px)`, size, rect);
		}
	}
	const FORM = /* @__PURE__ */ new Set([
		"INPUT",
		"SELECT",
		"TEXTAREA"
	]);
	for (const el of all) {
		if (FORM.has(el.tagName) || !hasOwnText(el)) continue;
		const style = styleOf(el);
		if (style.overflowX !== "hidden" && style.overflowX !== "clip") continue;
		if (style.textOverflow === "ellipsis") continue;
		const hidden = el.scrollWidth - el.clientWidth;
		if (el.clientWidth <= 0 || hidden <= 1) continue;
		const rect = rectOf(el);
		if (!isVisible(el, rect)) continue;
		push(el, "text-clipped", "warn", `text is cut off: ${hidden}px of it is hidden`, hidden, rect);
	}
	const covering = [];
	const edged = [];
	const screenArea = vw * vh;
	for (const el of all) {
		const style = styleOf(el);
		if (style.position !== "fixed" && style.position !== "sticky") continue;
		const rect = rectOf(el);
		if (!isVisible(el, rect)) continue;
		if (!covering.some((outer) => outer.contains(el))) {
			const behind = Number.parseInt(style.zIndex, 10) < 0 || style.pointerEvents === "none";
			const ix = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
			const iy = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
			const share = screenArea > 0 ? ix * iy / screenArea : 0;
			if (!behind && share > .3) {
				covering.push(el);
				const pct = Math.round(share * 100);
				push(el, "fixed-covers-screen", "warn", `${style.position} element covers ${pct}% of the screen before the user scrolls`, pct, rect);
			}
		}
		if (options.checkSafeArea && viewportFitCover && rect.height >= 8 && !edged.some((outer) => outer.contains(el))) {
			const padTop = Number.parseFloat(style.paddingTop) || 0;
			const padBottom = Number.parseFloat(style.paddingBottom) || 0;
			let flagged = false;
			if (rect.top <= 0 && rect.bottom > 0 && padTop < 20) {
				push(el, "safe-area", "warn", `touches the top edge with ${Math.round(padTop)}px padding: the camera cutout covers it`, padTop, rect);
				flagged = true;
			}
			if (rect.bottom >= vh - .5 && rect.top < vh && padBottom < 16) {
				push(el, "safe-area", "warn", `touches the bottom edge with ${Math.round(padBottom)}px padding: the home bar covers it`, padBottom, rect);
				flagged = true;
			}
			if (flagged) edged.push(el);
		}
	}
	for (const img of Array.from(body.querySelectorAll("img"))) {
		if (!img.complete || img.naturalWidth === 0) continue;
		const source = img.currentSrc || img.src;
		if (/\.svg(\?|#|$)/i.test(source) || source.startsWith("data:image/svg")) continue;
		const rect = rectOf(img);
		if (!isVisible(img, rect)) continue;
		const needed = rect.width * options.dpr;
		if (img.naturalWidth <= 2.5 * needed) continue;
		const ratio = Math.round(img.naturalWidth / needed * 10) / 10;
		push(img, "image-oversize", "info", `is ${img.naturalWidth}px wide but shown at ${Math.round(rect.width)}px (${Math.round(needed)}px needed at ${options.dpr}x): ${ratio}× too big`, ratio, rect, source.startsWith("data:") ? "(inline data image)" : source.slice(0, 120));
	}
	return issues;
}
/** Whether the page asked to draw under the notch (`viewport-fit=cover`). Self-contained, runs in the page. */
function hasViewportFitCover() {
	return Array.from(document.querySelectorAll("meta[name=\"viewport\" i]")).some((meta) => /viewport-fit\s*=\s*cover/i.test(meta.getAttribute("content") ?? ""));
}
// src/cli/system.ts
/** Side effects the CLI needs from the operating system, kept out of the pure modules. */
/** Whether anything answers HTTP on localhost:port within `timeoutMs`. */
function httpProbe(port, timeoutMs = 1500) {
	return new Promise((resolve) => {
		const req = request({
			host: "localhost",
			port,
			path: "/",
			method: "GET",
			timeout: timeoutMs
		}, (res) => {
			res.resume();
			resolve(true);
		});
		req.on("timeout", () => {
			req.destroy();
			resolve(false);
		});
		req.on("error", () => resolve(false));
		req.end();
	});
}
/** Opens a file with the system's default app (detached; errors are ignored). */
function openWithSystem(path) {
	const [command, args] = process.platform === "darwin" ? ["open", [path]] : process.platform === "win32" ? ["cmd", [
		"/c",
		"start",
		"",
		path
	]] : ["xdg-open", [path]];
	try {
		const child = spawn(command, args, {
			detached: true,
			stdio: "ignore"
		});
		child.on("error", () => void 0);
		child.unref();
	} catch {}
}
var INSTALL_COMMAND = "npx playwright install chromium";
/** Playwright's own message when its browser has not been downloaded. */
function isMissingBrowserError(error) {
	const text = error instanceof Error ? error.message : String(error);
	return /Executable doesn't exist|browserType\.launch:.*(install|download)|playwright install/i.test(text);
}
/**
* Downloads the headless Chromium that matches the installed Playwright, using
* Playwright's own installer. Progress goes to stderr so --json stdout stays clean.
*/
function installHeadlessChromium() {
	return new Promise((resolve) => {
		let cli;
		try {
			const require = createRequire(import.meta.url);
			cli = join(dirname(require.resolve("playwright/package.json")), "cli.js");
		} catch {
			resolve(false);
			return;
		}
		const child = spawn(process.execPath, [
			cli,
			"install",
			"--only-shell",
			"--no-remove",
			"chromium"
		], { stdio: [
			"ignore",
			2,
			2
		] });
		child.on("error", () => resolve(false));
		child.on("exit", (code) => resolve(code === 0));
	});
}
// src/cli/run.ts
/** A failure the user can fix: what went wrong plus the exact next command. */
var CheckError = class extends Error {
	next;
	detailText;
	constructor(message, next, detailText = "") {
		super(message);
		this.next = next;
		this.detailText = detailText;
		this.name = "CheckError";
	}
};
/** Same rules as the README: up to 10 overflow root causes per device. */
var MAX_OVERFLOW = 10;
var NETWORK_IDLE_CAP = 5e3;
/** Frame drawings are rendered at 2x (1x for very tall full-page shots, to stay under the bitmap limit). */
var FRAME_SCALE = 2;
var MAX_FRAME_PIXELS = 16e3;
var SAFE_AREA_OFF = {
	top: 0,
	bottom: 0,
	left: 0,
	right: 0
};
function jobsFor(devices, landscape) {
	return devices.flatMap((device) => {
		const portrait = {
			device,
			orientation: "portrait",
			base: device.id
		};
		return landscape ? [portrait, {
			device,
			orientation: "landscape",
			base: `${device.id}-landscape`
		}] : [portrait];
	});
}
/** Width and height from a PNG header (bytes 16–23). */
function pngSize(png) {
	const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
	if (png.byteLength < 24) return {
		width: 0,
		height: 0
	};
	return {
		width: view.getUint32(16),
		height: view.getUint32(20)
	};
}
function firstLine(error) {
	const text = error instanceof Error ? error.message : String(error);
	return (text.split("\n")[0] ?? text).replace(/^[a-zA-Z.]+: /, "");
}
/** Turns a navigation failure into a plain message and the next command to run. */
function describeLoadError(error, url, timeout) {
	const text = error instanceof Error ? error.message : String(error);
	const retry = `${RUN} check ${url}`;
	if (/ERR_CONNECTION_REFUSED|ECONNREFUSED/.test(text)) return new CheckError(`Nothing is answering at ${url}.`, `Start your dev server, then run: ${retry}`, text);
	if (/ERR_NAME_NOT_RESOLVED/.test(text)) return new CheckError(`The address ${new URL(url).host} could not be found.`, `Check the spelling, then run: ${retry}`, text);
	if (/ERR_FILE_NOT_FOUND/.test(text)) return new CheckError(`File not found: ${url.startsWith("file:") ? fileURLToPath(url) : url}`, "Check the path, then run the command again.", text);
	if (/ERR_CERT|SSL/.test(text)) return new CheckError(`The HTTPS certificate of ${url} is not valid.`, `For a local server use http://, e.g. ${RUN} check ${url.replace(/^https:/, "http:")}`, text);
	if (/Timeout \d+ms exceeded|TimeoutError/i.test(text)) return new CheckError(`The page did not finish loading within ${Math.round(timeout / 1e3)}s.`, `${retry} --timeout ${Math.min(timeout * 2, 6e5)}`, text);
	return new CheckError(`Could not open ${url}: ${firstLine(error)}`, `Check that the URL opens in your browser, then run: ${retry}`, text);
}
async function launchBrowser(options) {
	let chromium;
	try {
		({chromium} = await import("playwright"));
	} catch (error) {
		throw new CheckError("The playwright package is missing.", "npm install playwright", String(error));
	}
	try {
		return await chromium.launch({ headless: true });
	} catch (error) {
		if (!isMissingBrowserError(error)) throw new CheckError(`The headless browser could not start: ${firstLine(error)}`, INSTALL_COMMAND, String(error));
		if (!options.autoInstall) throw new CheckError("The headless browser is not installed yet.", INSTALL_COMMAND, String(error));
		options.log("Downloading a headless browser (one time, ~100 MB)…");
		if (!await installHeadlessChromium()) throw new CheckError("The headless browser could not be downloaded.", INSTALL_COMMAND);
		try {
			return await chromium.launch({ headless: true });
		} catch (retryError) {
			throw new CheckError(`The headless browser could not start: ${firstLine(retryError)}`, INSTALL_COMMAND, String(retryError));
		}
	}
}
async function setSafeArea(cdp, insets) {
	if (!cdp) return;
	await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: {
		top: insets.top,
		topMax: insets.top,
		bottom: insets.bottom,
		bottomMax: insets.bottom,
		left: insets.left,
		leftMax: insets.left,
		right: insets.right,
		rightMax: insets.right
	} }).catch(() => void 0);
}
/** Renders the framed and/or annotated screenshot in a separate page (the checked page is not touched). */
var ImageRenderer = class {
	browser;
	context = null;
	constructor(browser) {
		this.browser = browser;
	}
	async render(html, size) {
		const scale = size.height * FRAME_SCALE > MAX_FRAME_PIXELS ? "css" : "device";
		this.context ??= this.browser.newContext({ deviceScaleFactor: FRAME_SCALE });
		const page = await (await this.context).newPage();
		try {
			await page.setViewportSize({
				width: Math.ceil(size.width) + 2,
				height: Math.ceil(size.height) + 2
			});
			await page.setContent(html, { waitUntil: "load" });
			return await page.locator("#device").screenshot({
				omitBackground: true,
				scale
			});
		} finally {
			await page.close();
		}
	}
	async close() {
		if (this.context) await (await this.context).close();
	}
};
/** Removes files from an earlier run, only when the folder holds a phone-sim report. */
async function prepareOutDir(outDir) {
	await mkdir(outDir, { recursive: true });
	const entries = await readdir(outDir);
	if (!entries.includes("report.json")) return;
	const ours = entries.filter((name) => name.endsWith(".png") || /^report\.(json|md|html)$/.test(name));
	await Promise.all(ours.map((name) => rm(join(outDir, name), { force: true })));
}
async function checkOne(browser, chromeMajor, job, options) {
	const { device, orientation } = job;
	const emulation = emulationFor(device, orientation, chromeMajor);
	const context = await browser.newContext(emulation);
	try {
		const page = await context.newPage();
		const cdp = await context.newCDPSession(page).catch(() => null);
		await setSafeArea(cdp, safeAreaInsets(device, orientation));
		let status = null;
		try {
			const response = await page.goto(options.url, {
				waitUntil: "load",
				timeout: options.timeout
			});
			status = options.url.startsWith("file:") ? null : response?.status() ?? null;
		} catch (error) {
			throw describeLoadError(error, options.url, options.timeout);
		}
		await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_CAP }).catch(() => void 0);
		if (options.wait > 0) await page.waitForTimeout(options.wait);
		if (!await page.evaluate(hasViewportFitCover)) await setSafeArea(cdp, SAFE_AREA_OFF);
		await page.evaluate(() => window.scrollTo(0, 0));
		const ruleOptions = {
			ios: device.platform === "ios" || device.platform === "ipados",
			desktopClass: isDesktopClass(device),
			dpr: device.dpr,
			checkSafeArea: orientation === "portrait" && hasScreenCutout(device),
			maxOverflow: MAX_OVERFLOW
		};
		const issues = groupIssues(await page.evaluate(collectIssues, ruleOptions));
		const shot = options.fullPage ? {
			fullPage: true,
			scale: "css"
		} : { scale: "device" };
		const rawPng = await page.screenshot(shot);
		const pixels = pngSize(rawPng);
		const ratio = options.fullPage ? 1 : device.dpr;
		return {
			job,
			rawPng,
			cssSize: {
				width: pixels.width / ratio,
				height: pixels.height / ratio
			},
			report: {
				id: device.id,
				name: device.name,
				viewport: emulation.viewport,
				dpr: device.dpr,
				orientation,
				status,
				screenshot: join(options.outDir, `${job.base}.png`),
				rawScreenshot: join(options.outDir, `${job.base}-raw.png`),
				issues,
				omitted: {
					errors: 0,
					warnings: 0,
					infos: 0
				}
			}
		};
	} finally {
		await context.close().catch(() => void 0);
	}
}
/** Boxes drawn on a screenshot: errors and warnings, plus notes with --all. */
function annotatedIssues(issues, annotate, all) {
	if (!annotate) return [];
	return issues.filter((issue) => all || issue.severity !== "info");
}
async function writeImages(renderer, checked, options) {
	const { job, report, rawPng, cssSize } = checked;
	await writeFile(report.rawScreenshot, rawPng);
	const obstacles = options.frame ? screenObstacles(job.device, job.orientation) : {
		cornerRadius: 0,
		avoid: []
	};
	const overlay = layoutOverlay(annotatedIssues(report.issues, options.annotate, options.all), {
		width: report.viewport.width,
		...obstacles
	});
	const hasOverlay = overlay.boxes.length > 0;
	if (!options.frame && !hasOverlay) {
		await writeFile(report.screenshot, rawPng);
		return;
	}
	const input = {
		image: `data:image/png;base64,${rawPng.toString("base64")}`,
		content: cssSize,
		overlay: hasOverlay ? overlay : void 0
	};
	const png = options.frame ? await renderer.render(frameHtml({
		device: job.device,
		orientation: job.orientation,
		...input
	}), frameGeometry(job.device, job.orientation, cssSize).outer) : await renderer.render(screenHtml(input), cssSize);
	await writeFile(report.screenshot, png);
}
/**
* Checks every device (in parallel, one shared browser), aligns issue numbers
* across devices, then writes the plain and annotated screenshots.
*/
async function runCheck(options) {
	const jobs = jobsFor(options.devices, options.landscape);
	await prepareOutDir(options.outDir);
	const browser = await launchBrowser(options);
	const renderer = new ImageRenderer(browser);
	const version = browser.version();
	const chromeMajor = chromeMajorFrom(version, 140);
	let failure = null;
	let done = 0;
	try {
		const results = await mapLimit(jobs, options.concurrency, async (job) => {
			if (failure) return null;
			try {
				const result = await checkOne(browser, chromeMajor, job, options);
				done += 1;
				const turned = job.orientation === "landscape" ? " landscape" : "";
				options.log(`  [${done}/${jobs.length}] ${job.device.name}${turned}`);
				return result;
			} catch (error) {
				failure ??= error;
				return null;
			}
		});
		if (failure) throw failure instanceof CheckError ? failure : new CheckError(`The check stopped: ${firstLine(failure)}`, "Run the same command again with --debug for details.", String(failure));
		const checked = results.filter((result) => result !== null);
		const aligned = alignAcrossDevices(checked.map((item) => item.report.issues));
		const final = checked.map((item, index) => ({
			...item,
			report: {
				...item.report,
				issues: aligned[index] ?? []
			}
		}));
		await mapLimit(final, options.concurrency, (item) => writeImages(renderer, item, options));
		return {
			devices: final.map((item) => item.report),
			browserVersion: version
		};
	} finally {
		await renderer.close().catch(() => void 0);
		await browser.close().catch(() => void 0);
	}
}
/**
* Validates the report, writes report.md and report.html with every issue and
* report.json capped by `cap` (see JSON_CAP). Returns the JSON report.
*/
async function writeReportFiles(report, cap) {
	const full = reportSchema.parse(report);
	const capped = reportSchema.parse(capReport(full, cap));
	await writeFile(join(full.outDir, "report.json"), `${JSON.stringify(capped, null, 2)}\n`);
	await writeFile(join(full.outDir, "report.md"), toMarkdown(full));
	await writeFile(full.reportHtml, toHtml(full));
	return capped;
}
// src/cli/target.ts
/** Common local dev server ports, tried in this order when no URL is given. */
var DEV_PORTS = [
	3e3,
	5173,
	4321,
	8080,
	8e3,
	4200,
	3001
];
var LOCAL_HOST = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|[^/:]+\.localhost|[^/:]+\.local|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2})(?=$|[:/?#])/i;
function looksLikePath(input) {
	if (input.startsWith("./") || input.startsWith("../") || input.startsWith("/") || input.startsWith("~") || input.includes("\\")) return true;
	if (/^[^/]+:\d+(\/|$)/.test(input) || LOCAL_HOST.test(input) || /^[^/]+\.[^/]+\//.test(input)) return false;
	return /\.html?$/i.test(input);
}
/**
* Turns what a person types into a URL:
* `3000` / `:3000` → http://localhost:3000/, `localhost:5173` → http://…,
* `example.com` → https://…, `./page.html` → file://…
*/
function normalizeTarget(input, cwd, home = "") {
	const text = input.trim();
	if (text === "") return {
		ok: false,
		message: "The URL is empty."
	};
	const port = /^:?(\d{2,5})$/.exec(text);
	if (port?.[1]) {
		const number = Number(port[1]);
		if (number < 1 || number > 65535) return {
			ok: false,
			message: `${text} is not a valid port number.`
		};
		return {
			ok: true,
			url: `http://localhost:${number}/`,
			kind: "web"
		};
	}
	const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text);
	if (!hasScheme && looksLikePath(text)) {
		const expanded = text.startsWith("~") && home ? home + text.slice(1) : text;
		return {
			ok: true,
			url: pathToFileURL(resolve(cwd, expanded)).href,
			kind: "file"
		};
	}
	const candidate = hasScheme ? text : `${LOCAL_HOST.test(text) ? "http" : "https"}://${text}`;
	let url;
	try {
		url = new URL(candidate);
	} catch {
		return {
			ok: false,
			message: `"${text}" is not a URL.`
		};
	}
	if (url.protocol === "file:") return {
		ok: true,
		url: url.href,
		kind: "file"
	};
	if (url.protocol !== "http:" && url.protocol !== "https:") return {
		ok: false,
		message: `Only http, https and file URLs can be checked (got ${url.protocol}).`
	};
	if (!url.hostname) return {
		ok: false,
		message: `"${text}" has no host name.`
	};
	return {
		ok: true,
		url: url.href,
		kind: "web"
	};
}
/** The first port (in `ports` order) whose probe answers, probing all at once. */
async function findDevServer(probe, ports = DEV_PORTS) {
	const index = (await Promise.all(ports.map((port) => probe(port).catch(() => false)))).findIndex(Boolean);
	return index === -1 ? null : ports[index] ?? null;
}
// src/cli/index.ts
/** Parallel device pages in one browser. */
var CONCURRENCY = 4;
var stderr = (line) => process.stderr.write(`${line}\n`);
function fail(error, debug) {
	const style = pickStyle(process.stderr.isTTY, process.env);
	stderr(style.red(`✖ ${error.message}`));
	if (error.next) stderr(`  Next: ${error.next}`);
	if (debug) stderr(style.dim(error.detailText || error.stack || ""));
	return 2;
}
async function resolveUrl(input) {
	if (input !== void 0) {
		const target = normalizeTarget(input, process.cwd(), homedir());
		if (!target.ok) throw new CheckError(target.message, `${RUN} check http://localhost:3000`);
		if (target.kind === "file" && !existsSync(fileURLToPath(target.url))) throw new CheckError(`File not found: ${fileURLToPath(target.url)}`, "Check the path, then run the command again.");
		return target.url;
	}
	stderr(`Looking for a dev server on ports ${DEV_PORTS.join(", ")}…`);
	const port = await findDevServer((candidate) => httpProbe(candidate));
	if (port === null) throw new CheckError(`No dev server is running on ports ${DEV_PORTS.join(", ")}.`, `Start your dev server, or give the URL: ${RUN} check http://localhost:<port>`);
	const url = `http://localhost:${port}/`;
	stderr(`Found a dev server at ${url}`);
	return url;
}
async function check(options) {
	const selection = selectDevices({
		devices: options.devices,
		preset: options.preset
	}, devices);
	if (!selection.ok) throw new CheckError(selection.message, `${RUN} devices --search <name>   (lists every device id)`);
	const url = await resolveUrl(options.url);
	const outDir = resolve(process.cwd(), options.out);
	const turned = options.landscape ? " (portrait and landscape)" : "";
	stderr(`Checking ${url} on ${selection.devices.length} devices${turned}…`);
	const { devices: results } = await runCheck({
		url,
		devices: selection.devices,
		landscape: options.landscape,
		fullPage: options.fullPage,
		wait: options.wait,
		timeout: options.timeout,
		outDir,
		frame: options.frame,
		annotate: options.annotate,
		all: options.all,
		concurrency: CONCURRENCY,
		autoInstall: process.env.PHONE_SIM_NO_INSTALL === void 0 || process.env.PHONE_SIM_NO_INSTALL === "0",
		log: stderr
	});
	const report = {
		url,
		checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
		tool: {
			name: "phone-sim",
			version
		},
		outDir,
		reportHtml: join(outDir, "report.html"),
		viewportNote: VIEWPORT_NOTE,
		devices: results,
		summary: summarize(results)
	};
	const jsonReport = await writeReportFiles(report, options.all ? NO_CAP : JSON_CAP);
	const out = options.json ? process.stderr : process.stdout;
	out.write(`\n${formatHuman(report, pickStyle(out.isTTY, process.env), { all: options.all })}\n`);
	if (options.json) process.stdout.write(`${JSON.stringify(jsonReport, null, 2)}\n`);
	if (options.open) openWithSystem(report.reportHtml);
	return exitCodeFor(report.summary, options.failOn);
}
function listDevices(options) {
	const words = (options.search ?? "").toLowerCase().split(/\s+/).filter(Boolean);
	const matches = sortNewestFirst(devices).filter((device) => {
		const haystack = `${device.id} ${device.brand} ${device.name} ${device.platform}`.toLowerCase();
		return words.every((word) => haystack.includes(word));
	});
	if (options.json) {
		const rows = matches.map(({ id, name, brand, kind, platform, year, screen, dpr }) => ({
			id,
			name,
			brand,
			kind,
			platform,
			year,
			screen,
			dpr
		}));
		process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
		return 0;
	}
	if (matches.length === 0) {
		stderr(`No device matches "${options.search ?? ""}".`);
		stderr(`  Next: ${RUN} devices   (lists every device)`);
		return 2;
	}
	const idWidth = Math.max(...matches.map((device) => device.id.length));
	const nameWidth = Math.max(...matches.map((device) => device.name.length));
	for (const device of matches) process.stdout.write(`${device.id.padEnd(idWidth)}  ${device.name.padEnd(nameWidth)}  ${formatScreen(device).padEnd(16)}  ${device.platform}\n`);
	stderr(`\n${matches.length} devices. Use ids with: ${RUN} check <url> --devices ${matches[0]?.id ?? "iphone-16-pro"}`);
	return 0;
}
function init(options) {
	const dir = process.cwd();
	const changes = runInit(dir, options.dryRun);
	const verb = options.dryRun ? "Would change" : "Changed";
	const changed = changes.filter((change) => change.action !== "unchanged");
	for (const change of changes) {
		const action = change.action === "unchanged" ? "unchanged" : options.dryRun ? `would be ${change.action}` : change.action;
		process.stdout.write(`  ${change.file}: ${action} (${change.description})\n`);
	}
	if (changed.length === 0) process.stdout.write(`Already set up. AI agents here will run: ${RUN} check --json\n`);
	else {
		process.stdout.write(`${verb} ${changed.length} file${changed.length === 1 ? "" : "s"} in ${dir}.\n`);
		if (options.dryRun) process.stdout.write(`Run without --dry-run to apply: ${RUN} init\n`);
	}
	return 0;
}
async function main(argv) {
	const parsed = parseCli(argv);
	if (!parsed.ok) return fail(new CheckError(parsed.message, `${RUN} --help`), parsed.debug);
	const { value } = parsed;
	const debug = "options" in value && "debug" in value.options ? value.options.debug : false;
	try {
		switch (value.command) {
			case "help":
				process.stdout.write(`${HELP_TEXT}\n`);
				return 0;
			case "version":
				process.stdout.write(`${version}\n`);
				return 0;
			case "devices": return listDevices(value.options);
			case "init": return init(value.options);
			case "check": return await check(value.options);
		}
	} catch (error) {
		if (error instanceof CheckError) return fail(error, debug);
		return fail(new CheckError(`Something went wrong: ${error instanceof Error ? error.message.split("\n")[0] ?? error.message : String(error)}`, "Run the same command again with --debug for details.", error instanceof Error ? error.stack ?? "" : ""), debug);
	}
}
main(process.argv.slice(2)).then((code) => {
	process.exitCode = code;
}, (error) => {
	stderr(`✖ ${String(error)}`);
	process.exitCode = 2;
});
export {};
