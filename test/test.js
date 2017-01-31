'use strict';

module.exports = {
    'Compiler Sanity Check': function(test) { // Perform basic functions, just to make sure we're all there in the head
        test.throws(function() {
            jsHtml.compile();
        }, undefined, 'Compiler should throw error when no parameter is passed');
        test.equals(jsHtml.compile(''), '', 'Compiler should return an empty string when given an empty string');
        test.equals(jsHtml.compile(new Buffer(0)), '', 'Compiler should return an empty string when given an empty buffer');
        test.equals(vm.runInThisContext(jsHtml.compile('<?js "check" ?>')), 'check', 'Compiler should not wrap code directly');

        test.doesNotThrow(function() {
            vm.runInThisContext(jsHtml.compile(' \b')); // Creates a space, then takes it away (because it's evil like that, mwhahahaha). Prevents skewing of text formatting.
        }, 'eval of a simple document failed. Compiler should use pre-existing API functions');

        test.done();
    },
    'Advanced Compiler Testing': function(test) { // Now for some fun, let's really try to break this thing.
        test.doesNotThrow(function() {
            test.notEqual(jsHtml.compile('<?js?>'), '');
        }, undefined, 'Compiler failed to parse an immediately closed code block tag');

        test.doesNotThrow(function() {
            test.equals(jsHtml.compile('<?js'), '');
        }, undefined, 'Compiler failed to auto-close left open code block');

        // When testing direct compiler output, remember that ending spaces are not trimmed. <?js ?> will return '', but <?js  ?> will return ' '. This is design, to prevent code like the next test checks for.
        test.notEqual(jsHtml.compile('<?js"check" ?>'), '\"check\" ', 'Compiler failed to treat improperly opended code blocks as normal text');

        test.doesNotThrow(function() { // As I write this test, this should never happen, because there's no HTML parsing taking place. Only included this incase of future changes.
            var tmpScript = 'console.log(\'<script>document.write(\\"Testing here\\")</script>\'); ';
            test.equals(jsHtml.compile('<?js ' + tmpScript + '?>'), tmpScript);
        }, undefined, 'Compiler failed to properly parse valid JavaScript containing a string of HTML');

        test.doesNotThrow(function() { // This is something that gets a lot of parsers out there, false terminations. Is this fails there's likely something wrong with the JavaScript parser that's being used.
            var tmpScript = 'console.log(\'This is how to terminate a code block: ?>\'); ';
            test.equals(jsHtml.compile('<?js ' + tmpScript + '?>'), tmpScript);
        }, undefined, 'Compiler failed to properly parse valid JavaScript containing \'?>\' inside executable code');

        test.doesNotThrow(function() {
            jsHtml.compile('<?js (function() { ?><?js })(); ?>');
            jsHtml.compile('<?js (function() { ?><?js var test = undefined; ?><?js })(); ?>');
        }, undefined, 'Compiler failed to recognize a continuation of a block statement from a separate code block');

        test.notEqual(jsHtml.compile('<?js:testing?>', 'testing'), 'Compiler should not compile direct print code blocks as normal code');

        test.done();
    }
};