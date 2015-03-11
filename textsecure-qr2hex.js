(function () {
    "use strict";
    /* globals alert, console, document, QCodeDecoder, setTimeout, sjcl */

    var decoded = document.getElementById('decoded'),
        err = null,
        nothingDecodedText = "Nothing decoded.",
        qr = new QCodeDecoder(),
        reset = document.getElementById('reset'),
        stop = document.getElementById('stop'),
        video = document.getElementById('video');

    // Check browser support
    if (!qr.isCanvasSupported()) {
        err = Error('Canvas element is not supported in this browser.');
        alert(err.toString());
        throw err;
    }
    if (!qr.hasGetUserMedia()) {
        err = Error('getUserMedia is not supported in this browser.');
        alert(err.toString());
        throw err;
    }

    // Handlers
    var handleResetClick = function () {
        qr.decodeFromCamera(video, handleScanResult);
        decoded.textContent = nothingDecodedText;
    };

    var handleScanResult = function (qrErr, qrResult) {

        var expectedBase64StringLength = 44, // bytes
            expectedHexStringLength = 66, // characters
            octetCount = expectedHexStringLength / 2,
            octets = new Array(octetCount),
            resultBits = null,
            resultHex = null,
            spacedHexString = null;

        // FIXME: review the qcode-decoder code to see what exceptions can be
        // thrown.
        if (null !== qrErr) {
            console.log(qrErr);
            throw qrErr;
        }

        if (qrResult.length !== expectedBase64StringLength) {
            var msg = 'The QR code payload is ' +
                      qrResult.length.toString() +
                      ' characters long.  It should be ' +
                      expectedBase64StringLength.toString() +
                      ' characters long.',
                err = new Error(msg);
            alert(err.toString());
            throw err;
        }

        // The only exception that this code attempts to handle is a
        // sjcl.exception.invalid exception, thrown when qrResult is
        // not well-formed base64-encoded data.
        try {
            resultBits = sjcl.codec.base64.toBits(qrResult);
        }
        catch (exception) {
            var msg = 'The QR code payload is not properly base64-encoded.',
                err = new Error(msg);
            alert(err.toString());
            throw err;
        }

        resultHex = sjcl.codec.hex.fromBits(resultBits);

        for (var i = 0; i < octetCount; i++) {
            octets[i] = resultHex.substr(i * 2, 2);
        }
        spacedHexString = octets.join(" ");

        console.log("Scanned: " + spacedHexString);
        decoded.textContent = spacedHexString;

        stopAfterCallbacksComplete();
    };

    var handleStopClick = function () {
        qr.stop();
    };

    var stopAfterCallbacksComplete = function() {
        setTimeout(function () {qr.stop();}, 0);
    };

    // Begin capturing and decoding video
    qr.decodeFromCamera(video, handleScanResult);

    reset.addEventListener('click', handleResetClick, false);
    stop.addEventListener('click', handleStopClick, false);

})();
