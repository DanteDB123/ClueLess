/**
 * Class to handle Game Engine functions.
 *
 * @module src/GameEngine
 */
define([
], function () {
    'use strict';

    var gameEngine = declare(null, {

        /**
         * Adds CSS styles to header of page.
         * @instance
         * @public
         * @param {String} styles - CSS styles to add to the header of page.
         */
        addStylesToHeader: function (styles) {
            var styleNode = this._getStyleNode() || domConstruct.create('style', {
                type: 'text/css'
            }, this._getHeadNode(), 'last');

            if (styleNode.innerHTML.indexOf(styles) < 0) {
                styleNode.innerHTML += styles;
            }
        }
    });

    return new gameEngine();
});
