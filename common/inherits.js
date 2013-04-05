"use strict";

function inherits (childConstructor, parentConstructor) {
    function C() {};
    C.prototype = parentConstructor.prototype;
    childConstructor.prototype = new C();
    childConstructor.prototype.constructor = childConstructor;
};
