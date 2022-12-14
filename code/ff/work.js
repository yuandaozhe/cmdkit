self.importScripts('./cmdkitTool.js');
const kTransLog = 4;
const kTransInfo2 = 5;
console.log = function (str) {
    var objData = {
        t: kTransLog,
        d: str
    };
    self.postMessage(objData);
};
function onInit() {
    self.onCallback = Module.addFunction(function (buff, size) {
        var outArray = Module.HEAPU8.subarray(buff, buff + size);
        var data = new Uint8Array(outArray);
        var objData = {
            t: kTransInfo,
            d: data
        };
        self.postMessage(objData, [objData.d.buffer]);
    }, 'vii');
    self.init = true;
    var info = "初始化完成，可以开始转码";
    var objData = {
        t: kTransInfo2,
        d: info
    };
    self.postMessage(objData);
};
Module.onRuntimeInitialized = () => { onInit(); }//等待初始化完成后才开始调用
const kUploadFile = 0;
const kTrans = 1;
const kTransInfo = 2;
const kDownFile = 3;
self.onmessage = function (evt) {
    if (!self.init) {
        console.log("not initialized!");
        return;
    }

    var objData = evt.data;
    switch (objData.t) {
        case kUploadFile:
            self.onUpFile(objData.d);
            break;
        case kTrans:
            self.onTrans();
            break;
        default:
            console.log("Unsupport messsage " + objData.t);
    }
};
function stringToUint8Array(str) {
    var arr = [];
    for (var i = 0, j = str.length; i < j; ++i) {
        arr.push(str.charCodeAt(i));
    }

    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array
}
function Uint8ArrayToString(fileData) {
    var dataString = "";
    for (var i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
    }
    return dataString
}
self.onUpFile = function (slice) {
    if (!self.handle) self.handle = Module._cmdkit_start_file();
    let data = stringToUint8Array(slice);
    let mem_data = Module._malloc(data.length);
    Module.HEAPU8.set(data, mem_data);
    Module._cmdkit_update_file(self.handle, mem_data, data.length);
    Module._free(mem_data);
};
self.onTrans = function () {
    self.handle = Module._run_ff(self.handle, self.onCallback);

    let data = new Uint8Array(1024 * 10);
    let mem_data = Module._malloc(data.length);
    let len = 0;
    let data2 = new Uint8Array();
    Module.HEAPU8.set(data, mem_data);
    while (true) {
        len = Module._get_file(self.handle, mem_data, data.length);
        {
            let curLen = data2.length;
            let tmp = new Uint8Array(curLen + len);
            tmp.set(data2);
            tmp.set(Module.HEAPU8.subarray(mem_data, mem_data + len), curLen);
            data2 = tmp;
        }
        if (len != data.length) break;
    }
    self.handle = null;
    var objData = {
        t: kDownFile,
        d: data2
    };
    self.postMessage(objData, [objData.d.buffer]);
};
