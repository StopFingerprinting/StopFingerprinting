"use strict";

/**
 * Prototypal inheritance helper.
 * @param  {Function} childConstructor  The child constructor.
 * @param  {Function} parentConstructor The inherited constructor.
 */
function inherits (childConstructor, parentConstructor) {
    function C() {};
    C.prototype = parentConstructor.prototype;
    childConstructor.prototype = new C();
    childConstructor.prototype.constructor = childConstructor;
};
