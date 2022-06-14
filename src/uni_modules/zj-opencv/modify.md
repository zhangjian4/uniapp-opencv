## opencv.js 修改部分

* 微信小程序没有`TextDecoder`
```diff
+// #ifdef MP-WEIXIN
+import { TextDecoder } from 'text-encoder';
+// #endif
```

* APP端没有fetch方法,用base64导入wasm
```diff
+// #ifdef APP-PLUS
+import { wasmBinaryFile } from './wasmBinaryFile';
+// #endif
```


* 用作ESModule引入需要`export default`
```diff
-(function (root, factory) {
+export default (function (root, factory) {
-    if (typeof define === 'function' && define.amd) {
-        // AMD. Register as an anonymous module.
-        define(function () {
-            return (root.cv = factory());
-        });
-    } else if (typeof module === 'object' && module.exports) {
-        // Node. Does not work with strict CommonJS, but
-        // only CommonJS-like environments that support module.exports,
-        // like Node.
-        module.exports = factory();
-        // module.exports.cv = factory();
-    } else if (typeof window === 'object') {
-        // Browser globals
-        // root.cv = factory();
-        return factory();
-    } else if (typeof importScripts === 'function') {
-        // Web worker
-        root.cv = factory();
-    } else {
-        // Other shells, e.g. d8
-        root.cv = factory();
-    }
+    return factory();
 })(this, function () {
```
```diff
-    if (typeof exports === 'object' && typeof module === 'object') module.exports = cv;
-    else if (typeof define === 'function' && define['amd'])
-        define([], function () {
-            return cv;
-        });
-    else if (typeof exports === 'object') exports['cv'] = cv;
-
-    if (typeof Module === 'undefined') var Module = {};
-    return cv(Module);
```

* 微信小程序中要用`WXWebAssembly`代替`WebAssembly`
* 微信小程序没有`crypto.getRandomValues()`方法
* 微信小程序没有`performance.now()`方法
```diff
     var cv = (function () {
+        // #ifdef MP-WEIXIN
+        var WebAssembly = WXWebAssembly;
+        var crypto = {
+            getRandomValues(b) {
+                let byteRange = 256;
+                for (var i = 0; i < b.length; i++) {
+                    b[i] = Math.floor(byteRange * Math.random());
+                }
+            },
+        };
+        var performance = {
+            now() {
+                return Date.now();
+            },
+        };
+        // #endif
         var _scriptDir =
             typeof document !== 'undefined' && document.currentScript
                ? document.currentScript.src
                : undefined;
```

* 没有使用到`UTF16Decoder`
```diff
-            var UTF16Decoder =
-                typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
             function writeArrayToMemory(array, buffer) {
                 HEAP8.set(array, buffer);
             }
```

* wasm文件作为资源文件引入,微信小程序端需要使用brotli压缩,删除`locateFile`,不然在h5端会把路径指向`/static/js`下
```diff
-            var wasmBinaryFile ='data:application/octet-stream;base64,...';
+            // #ifdef H5
+            var wasmBinaryFile = '/uni_modules/zj-opencv/static/h5/opencv.wasm';
+            // #endif
+            // #ifdef  MP-WEIXIN
+            var wasmBinaryFile = '/uni_modules/zj-opencv/static/mp-weixin/opencv.wasm.br';
+            // #endif
-            if (!isDataURI(wasmBinaryFile)) {
-                wasmBinaryFile = locateFile(wasmBinaryFile);
-            }
```

* APP端`WebAssembly.instantiate`不会进入`then`,采用同步的方式
```diff
                     return getBinaryPromise()
                         .then(function (binary) {
-                            return WebAssembly.instantiate(binary, info);
+                            var module = new WebAssembly.Module(binary);
+                            var instance = new WebAssembly.Instance(module, info);
+                            return { instance: instance };
                         })
```

* 微信小程序要用`WXWebAssembly.instantiate`方法传入路径,H5和APP用`WebAssembly.instantiateStreaming`
```diff
                 function instantiateAsync() {
+                    // #ifdef MP-WEIXIN
+                    return WXWebAssembly.instantiate(wasmBinaryFile, info).then(
+                        receiveInstantiatedSource
+                    );
+                    // #endif
+                    // #ifdef H5||APP-PLUS
                     if (
                         !wasmBinary &&
                         typeof WebAssembly.instantiateStreaming === 'function' &&
                         !isDataURI(wasmBinaryFile) &&
                         typeof fetch === 'function'
                     ) {
                         fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (
                             response
                         ) {
                             var result = WebAssembly.instantiateStreaming(response, info);
                             return result.then(receiveInstantiatedSource, function (reason) {
                                 err('wasm streaming compile failed: ' + reason);
                                 err('falling back to ArrayBuffer instantiation');
                                 instantiateArrayBuffer(receiveInstantiatedSource);
                             });
                         });
                     } else {
                         return instantiateArrayBuffer(receiveInstantiatedSource);
                     }
+                    // #endif
                }
```

* 微信小程序不支持`new Function`
```diff
             function createNamedFunction(name, body) {
                 name = makeLegalFunctionName(name);
-                return new Function(
-                    'body',
-                    'return function ' +
-                        name +
-                        '() {\n' +
-                        '    "use strict";' +
-                        '    return body.apply(this, arguments);\n' +
-                        '};\n'
-                )(body);
+                return (function (body) {
+                    return function () {
+                        'use strict';
+                        return body.apply(this, arguments);
+                    };
+                })(body);
            }
            
```
```diff
            function embind__requireFunction(signature, rawFunction) {
                signature = readLatin1String(signature);
                function makeDynCaller(dynCall) {
-                    var args = [];
-                    for (var i = 1; i < signature.length; ++i) {
-                        args.push('a' + i);
-                    }
-                    var name = 'dynCall_' + signature + '_' + rawFunction;
-                    var body = 'return function ' + name + '(' + args.join(', ') + ') {\n';
-                    body +=
-                        '    return dynCall(rawFunction' +
-                        (args.length ? ', ' : '') +
-                        args.join(', ') +
-                        ');\n';
-                    body += '};\n';
-                    return new Function('dynCall', 'rawFunction', body)(dynCall, rawFunction);
+                    return (function (dynCall, rawFunction) {
+                        return function () {
+                            return dynCall(rawFunction, ...arguments);
+                        };
+                    })(dynCall, rawFunction);
                }
                var fp;
```
```diff
             function craftInvokerFunction(
                 humanName,
                 argTypes,
                 classType,
                 cppInvokerFunc,
                 cppTargetFunc
             ) {
                 var argCount = argTypes.length;
                 if (argCount < 2) {
                     throwBindingError(
                         "argTypes array size mismatch! Must at least get return value and 'this' types!"
                     );
                 }
                 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
                 var needsDestructorStack = false;
                 for (var i = 1; i < argTypes.length; ++i) {
                     if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
                         needsDestructorStack = true;
                         break;
                     }
                 }
                 var returns = argTypes[0].name !== 'void';
-                var argsList = '';
-                var argsListWired = '';
-                for (var i = 0; i < argCount - 2; ++i) {
-                    argsList += (i !== 0 ? ', ' : '') + 'arg' + i;
-                    argsListWired += (i !== 0 ? ', ' : '') + 'arg' + i + 'Wired';
-                }
-                var invokerFnBody =
-                    'return function ' +
-                    makeLegalFunctionName(humanName) +
-                    '(' +
-                    argsList +
-                    ') {\n' +
-                    'if (arguments.length !== ' +
-                    (argCount - 2) +
-                    ') {\n' +
-                    "throwBindingError('function " +
-                    humanName +
-                    " called with ' + arguments.length + ' arguments, expected " +
-                    (argCount - 2) +
-                    " args!');\n" +
-                    '}\n';
-                if (needsDestructorStack) {
-                    invokerFnBody += 'var destructors = [];\n';
-                }
-                var dtorStack = needsDestructorStack ? 'destructors' : 'null';
-                var args1 = [
-                    'throwBindingError',
-                    'invoker',
-                    'fn',
-                    'runDestructors',
-                    'retType',
-                    'classParam',
-                ];
                 var args2 = [
                     throwBindingError,
                     cppInvokerFunc,
                     cppTargetFunc,
                     runDestructors,
                     argTypes[0],
                     argTypes[1],
                 ];
-                if (isClassMethodFunc) {
-                    invokerFnBody +=
-                        'var thisWired = classParam.toWireType(' + dtorStack + ', this);\n';
-                }
                 for (var i = 0; i < argCount - 2; ++i) {
-                    invokerFnBody +=
-                        'var arg' +
-                        i +
-                        'Wired = argType' +
-                        i +
-                        '.toWireType(' +
-                        dtorStack +
-                        ', arg' +
-                        i +
-                        '); // ' +
-                        argTypes[i + 2].name +
-                        '\n';
-                    args1.push('argType' + i);
                     args2.push(argTypes[i + 2]);
                 }
                 if (isClassMethodFunc) {
-                    argsListWired =
-                        'thisWired' + (argsListWired.length > 0 ? ', ' : '') + argsListWired;
+                    for (var i = 1; i < argCount; ++i) {
+                        if (argTypes[i].destructorFunction !== null) {
+                            args2.push(argTypes[i].destructorFunction);
+                        } else {
+                            args2.push(null);
+                        }
+                    }
-                }
+                } else {
+                    for (var i = 2; i < argCount; ++i) {
+                        if (argTypes[i].destructorFunction !== null) {
+                            args2.push(argTypes[i].destructorFunction);
+                        } else {
+                            args2.push(null);
+                        }
+                    }
+                }
-                invokerFnBody +=
-                    (returns ? 'var rv = ' : '') +
-                    'invoker(fn' +
-                    (argsListWired.length > 0 ? ', ' : '') +
-                    argsListWired +
-                    ');\n';
-                if (needsDestructorStack) {
-                    invokerFnBody += 'runDestructors(destructors);\n';
-                } else {
-                    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
-                        var paramName = i === 1 ? 'thisWired' : 'arg' + (i - 2) + 'Wired';
-                        if (argTypes[i].destructorFunction !== null) {
-                            invokerFnBody +=
-                                paramName +
-                                '_dtor(' +
-                                paramName +
-                                '); // ' +
-                                argTypes[i].name +
-                                '\n';
-                            args1.push(paramName + '_dtor');
-                            args2.push(argTypes[i].destructorFunction);
-                        }
-                    }
-                }
-                if (returns) {
-                    invokerFnBody += 'var ret = retType.fromWireType(rv);\n' + 'return ret;\n';
-                } else {
-                }
-                invokerFnBody += '}\n';
-                args1.push(invokerFnBody);
-                var invokerFunction = new_(Function, args1).apply(null, args2);
+                var invokerFunction = (function(throwBindingError, invoker, fn, runDestructors, retType, classParam) {
+                    // argType0,argType1,argType2
+                    const argsTypeOrigin = Array.prototype.slice.call(
+                        arguments,
+                        6,
+                        6 + argCount - 2
+                    );
+                    // arg0Wired_dtor
+                    const argsWired_dtorOrigin = Array.prototype.slice.call(
+                        arguments,
+                        6 + argCount - 2
+                    );
+
+                    return function () {
+                        // arg0, arg1, arg2
+                        if (arguments.length !== argCount - 2) {
+                            throwBindingError(
+                                'function ' +
+                                    humanName +
+                                    ' called with ' +
+                                    arguments.length +
+                                    ' arguments, expected 0 args!'
+                            );
+                        }
+                        var thisWired;
+                        if (isClassMethodFunc) {
+                            if (needsDestructorStack) {
+                                var destructors = [];
+                                thisWired = classParam.toWireType(destructors, this);
+                            } else {
+                                thisWired = classParam.toWireType(null, this);
+                            }
+                        }
+
+                        // arg0Wired,arg1Wired,arg2Wired
+                        var argsWired = [];
+                        for (var i = 0; i < arguments.length; i++) {
+                            argsWired.push(argsTypeOrigin[i].toWireType(null, arguments[i]));
+                        }
+
+                        var rv;
+                        if (isClassMethodFunc) {
+                            rv = invoker(fn, thisWired, ...argsWired);
+                        } else {
+                            rv = invoker(fn, ...argsWired);
+                        }
+
+                        if (needsDestructorStack) {
+                            runDestructors(destructors);
+                        } else {
+                            if (isClassMethodFunc) {
+                                for (var i = 1; i < argTypes.length; ++i) {
+                                    if (argTypes[i].destructorFunction !== null) {
+                                        argsWired_dtorOrigin[i - 1](thisWired);
+                                    }
+                                }
+                            } else {
+                                for (var i = 2; i < argTypes.length; ++i) {
+                                    if (argTypes[i].destructorFunction !== null) {
+                                        argsWired_dtorOrigin[i - 2](argsWired[i - 2]);
+                                    }
+                                }
+                            }
+                        }
+                        if (returns) {
+                            var ret = retType.fromWireType(rv);
+                            return ret;
+                        }
+                    };
+                }).apply(null, args2);
                 return invokerFunction;
             }
```