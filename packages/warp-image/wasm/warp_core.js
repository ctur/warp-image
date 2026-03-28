/* @ts-self-types="./warp_core.d.ts" */

class ImageProcessor {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ImageProcessorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_imageprocessor_free(ptr, 0);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    crop(x, y, width, height) {
        wasm.imageprocessor_crop(this.__wbg_ptr, x, y, width, height);
    }
    flip_horizontal() {
        wasm.imageprocessor_flip_horizontal(this.__wbg_ptr);
    }
    flip_vertical() {
        wasm.imageprocessor_flip_vertical(this.__wbg_ptr);
    }
    /**
     * Returns the detected format of the input image (e.g. "jpeg", "png", "webp").
     * @returns {string}
     */
    format() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.imageprocessor_format(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export(deferred1_0, deferred1_1, 1);
        }
    }
    grayscale() {
        wasm.imageprocessor_grayscale(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    height() {
        const ret = wasm.imageprocessor_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Encode to JPEG using mozjpeg-rs (pure-Rust mozjpeg).
     *
     * `Preset::BaselineFastest` disables trellis quantization and Huffman
     * optimisation — encoding is 4-10× faster than `BaselineBalanced` with
     * files ~10-20% larger at equivalent quality.  For server-side image
     * pipelines where throughput matters, this is the right default.
     *
     * Zero-copy fast path: if the source image is already RGB8 (the common
     * case for decoded JPEGs) we borrow the pixel buffer directly instead of
     * calling `to_rgb8()` which would copy the entire frame (~17 MB for a
     * 2725×2225 image).
     * @param {number} quality
     * @returns {Uint8Array}
     */
    jpeg(quality) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.imageprocessor_jpeg(retptr, this.__wbg_ptr, quality);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {Uint8Array} buffer
     */
    constructor(buffer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(buffer, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.imageprocessor_new(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            ImageProcessorFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    png() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.imageprocessor_png(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Resize preserving aspect ratio (fits within width × height).
     * Uses SIMD-accelerated fast_image_resize when the pixel format supports it.
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        wasm.imageprocessor_resize(this.__wbg_ptr, width, height);
    }
    /**
     * Resize to exact dimensions (may distort aspect ratio).
     * Uses SIMD-accelerated fast_image_resize when the pixel format supports it.
     * @param {number} width
     * @param {number} height
     */
    resize_exact(width, height) {
        wasm.imageprocessor_resize_exact(this.__wbg_ptr, width, height);
    }
    rotate180() {
        wasm.imageprocessor_rotate180(this.__wbg_ptr);
    }
    rotate270() {
        wasm.imageprocessor_rotate270(this.__wbg_ptr);
    }
    rotate90() {
        wasm.imageprocessor_rotate90(this.__wbg_ptr);
    }
    /**
     * Encodes the image as WebP.
     *
     * Note: `image-webp` only supports lossless VP8L encoding. The `quality`
     * parameter is accepted for API compatibility but is ignored — output is
     * always lossless.
     * @param {number} _quality
     * @returns {Uint8Array}
     */
    webp(_quality) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.imageprocessor_webp(retptr, this.__wbg_ptr, _quality);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    width() {
        const ret = wasm.imageprocessor_width(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) ImageProcessor.prototype[Symbol.dispose] = ImageProcessor.prototype.free;
exports.ImageProcessor = ImageProcessor;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_df03e93053e0f4bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        },
    };
    return {
        __proto__: null,
        "./warp_core_bg.js": import0,
    };
}

const ImageProcessorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_imageprocessor_free(ptr >>> 0, 1));

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function dropObject(idx) {
    if (idx < 1028) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getObject(idx) { return heap[idx]; }

let heap = new Array(1024).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
function decodeText(ptr, len) {
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const wasmPath = `${__dirname}/warp_core_bg.wasm`;
const wasmBytes = require('fs').readFileSync(wasmPath);
const wasmModule = new WebAssembly.Module(wasmBytes);
let wasm = new WebAssembly.Instance(wasmModule, __wbg_get_imports()).exports;
