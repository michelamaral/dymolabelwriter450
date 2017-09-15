//----------------------------------------------------------------------------
//
//  $Id: PrintMeThatLabel.js 38773 2015-09-17 11:45:41Z nmikalko $ 
//
// Project -------------------------------------------------------------------
//
//  DYMO Label Framework
//
// Content -------------------------------------------------------------------
//
//  Web SDK print label sample
//
//----------------------------------------------------------------------------
//
//  Copyright (c), 2011, Sanford, L.P. All Rights Reserved.
//
//----------------------------------------------------------------------------


(function()
{
    // utility functions from goog.dom

    /**
     * Enumeration for DOM node types (for reference)
     * @enum {number}
     */
    var NodeType = {
      ELEMENT: 1,
      ATTRIBUTE: 2,
      TEXT: 3,
      CDATA_SECTION: 4,
      ENTITY_REFERENCE: 5,
      ENTITY: 6,
      PROCESSING_INSTRUCTION: 7,
      COMMENT: 8,
      DOCUMENT: 9,
      DOCUMENT_TYPE: 10,
      DOCUMENT_FRAGMENT: 11,
      NOTATION: 12
    };


    /**
     * Removes all the child nodes on a DOM node.
     * @param {Node} node Node to remove children from.
     */
    var removeChildren = function(node) {
      // Note: Iterations over live collections can be slow, this is the fastest
      // we could find. The double parenthesis are used to prevent JsCompiler and
      // strict warnings.
      var child;
      while ((child = node.firstChild)) {
        node.removeChild(child);
      }
    };

    /**
     * Returns the owner document for a node.
     * @param {Node|Window} node The node to get the document for.
     * @return {!Document} The document owning the node.
     */
    var getOwnerDocument = function(node) {
      // TODO(user): Remove IE5 code.
      // IE5 uses document instead of ownerDocument
      return /** @type {!Document} */ (
          node.nodeType == NodeType.DOCUMENT ? node :
          node.ownerDocument || node.document);
    };

    /**
     * Cross-browser function for setting the text content of an element.
     * @param {Element} element The element to change the text content of.
     * @param {string} text The string that should replace the current element
     *     content.
     */
    var setTextContent = function(element, text) {
      if ('textContent' in element) {
        element.textContent = text;
      } else if (element.firstChild &&
                 element.firstChild.nodeType == NodeType.TEXT) {
        // If the first child is a text node we just change its data and remove the
        // rest of the children.
        while (element.lastChild != element.firstChild) {
          element.removeChild(element.lastChild);
        }
        element.firstChild.data = text;
      } else {
        removeChildren(element);
        var doc = getOwnerDocument(element);
        element.appendChild(doc.createTextNode(text));
      }
    };





    // app settings stored between sessions
    var Settings = function()
    {
        this.currentPrinterName = "";
        this.printerUris = [];
    }
    
    // loads settings
    Settings.prototype.load = function()
    {
        var currentPrinterName = Cookie.get('currentPrinterName');
        var printerUris = Cookie.get('printerUris');
        
        if (currentPrinterName)
            this.currentPrinterName = currentPrinterName;
            
        if (printerUris)
            this.printerUris = printerUris.split('|');
    }
    
    Settings.prototype.save = function()
    {
        Cookie.set('currentPrinterName', this.currentPrinterName, 24*365);
        Cookie.set('printerUris', this.printerUris.join('|'), 24*365);
    }

    // called when the document completly loaded
    function onload()
    {
        var printButton = document.getElementById('printButton');
        var printerSettingsButton = document.getElementById('printerSettingsButton');
        //var labelSettingsDiv = document.getElementById('labelSettingsDiv');
        var printerSettingsDiv = document.getElementById('printerSettingsDiv');
        var printerUriTextBox = document.getElementById('printerUriTextBox');
        var addPrinterUriButton = document.getElementById('addPrinterUriButton');
        var clearPrinterUriButton = document.getElementById('clearPrinterUriButton');
        var printersComboBox = document.getElementById('printersComboBox');
        var jobStatusMessageSpan = document.getElementById('jobStatusMessageSpan');
        
            
        var settings = new Settings();
            
        // save settings to cookies
        
        function saveSettings()
        {
            settings.currentPrinterName = printersComboBox.value;
            
            settings.save();
        }

        // caches a list of printers
        var printers = [];

        // loads all supported printers into a combo box 
        function updatePrinters()
        {
            // clear first
            removeChildren(printersComboBox);
            //while (printersComboBox.firstChild) 
            //    printersComboBox.removeChild(printersComboBox.firstChild);

            printers = dymo.label.framework.getPrinters();
            //if (printers.length == 0)
            //{
            //    alert("No DYMO printers are installed. Install DYMO printers.");
            //    return;
            //}

            for (var i = 0; i < printers.length; i++)
            {
                var printerName = printers[i].name;

                var option = document.createElement('option');
                option.value = printerName;
                option.appendChild(document.createTextNode(printerName));
                printersComboBox.appendChild(option);

                if (printerName == settings.currentPrinterName)
                    printersComboBox.selectedIndex = i;
            }

            printerSettingsDiv.style.display= printers.length == 0 ? 'block' : 'none';
        };

        var addressLabel = null;
        var tapeLabel = null;
        var DZLabel = null;

        // load DZ label xml
        function getDZLabelXml()
        {
            var labelXml = '<?xml version="1.0" encoding="utf-8" ?>\
                            <DieCutLabel Version="8.0" Units="twips">\
                              <PaperOrientation>Landscape</PaperOrientation>\
                              <Id>VinylBlkOnWht41_1mm</Id>\
                              <IsOutlined>false</IsOutlined>\
                              <CustomPaper>\
                                <Size Width="2330" Height="4360" />\
                                <PrintableSize Width="2126" Height="4360" />\
                                <PrintableOrigin X="102" Y="0" />\
                                <Offset X="0" Y="0" />\
                              </CustomPaper>\
                              <DrawCommands>\
                                <RoundRectangle X="0" Y="-340" Width="2330" Height="5040" Rx="0" Ry="0" />\
                              </DrawCommands>\
                              <ObjectInfo>\
                                <TextObject>\
                                  <Name>Text</Name>\
                                  <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />\
                                  <BackColor Alpha="0" Red="255" Green="255" Blue="255" />\
                                  <LinkedObjectName></LinkedObjectName>\
                                  <Rotation>Rotation0</Rotation>\
                                  <IsMirrored>False</IsMirrored>\
                                  <IsVariable>True</IsVariable>\
                                  <HorizontalAlignment>Left</HorizontalAlignment>\
                                  <VerticalAlignment>Middle</VerticalAlignment>\
                                  <TextFitMode>ShrinkToFit</TextFitMode>\
                                  <UseFullFontHeight>True</UseFullFontHeight>\
                                  <Verticalized>False</Verticalized>\
                                  <StyledText/>\
                                </TextObject>\
                                <Bounds X="332" Y="150" Width="4455" Height="1260" />\
                              </ObjectInfo>\
                            </DieCutLabel>';
            return labelXml;
        }

        // load address label xml
        function getAddressLabelXml()
        {
            var labelXml = '<?xml version="1.0" encoding="utf-8"?>\
                            <DieCutLabel Version="8.0" Units="twips">\
                                <PaperOrientation>Landscape</PaperOrientation>\
                                <Id>Address</Id>\
                                <PaperName>30252 Address</PaperName>\
                                <DrawCommands>\
                                    <RoundRectangle X="0" Y="0" Width="1581" Height="5040" Rx="270" Ry="270" />\
                                </DrawCommands>\
                                <ObjectInfo>\
                                    <AddressObject>\
                                        <Name>Address</Name>\
                                        <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />\
                                        <BackColor Alpha="0" Red="255" Green="255" Blue="255" />\
                                        <LinkedObjectName></LinkedObjectName>\
                                        <Rotation>Rotation0</Rotation>\
                                        <IsMirrored>False</IsMirrored>\
                                        <IsVariable>True</IsVariable>\
                                        <HorizontalAlignment>Left</HorizontalAlignment>\
                                        <VerticalAlignment>Middle</VerticalAlignment>\
                                        <TextFitMode>ShrinkToFit</TextFitMode>\
                                        <UseFullFontHeight>True</UseFullFontHeight>\
                                        <Verticalized>False</Verticalized>\
                                        <StyledText/>\
                                        <ShowBarcodeFor9DigitZipOnly>False</ShowBarcodeFor9DigitZipOnly>\
                                        <BarcodePosition>BelowAddress</BarcodePosition>\
                                        <LineFonts/>\
                                    </AddressObject>\
                                    <Bounds X="332" Y="150" Width="4455" Height="1260" />\
                                </ObjectInfo>\
                            </DieCutLabel>';
            return labelXml;
        }

        // load tap label xml
        function getTapeLabelXml()
        {
            var labelXml = '<?xml version="1.0" encoding="utf-8"?>\
                            <ContinuousLabel Version="8.0" Units="twips">\
                                <PaperOrientation>Landscape</PaperOrientation>\
                                <Id>Tape12mm</Id>\
                                <PaperName>12mm</PaperName>\
                                <LengthMode>Auto</LengthMode>\
                                <LabelLength>0</LabelLength>\
                                <RootCell>\
                                    <TextObject>\
                                        <Name>Text</Name>\
                                        <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />\
                                        <BackColor Alpha="0" Red="255" Green="255" Blue="255" />\
                                        <LinkedObjectName></LinkedObjectName>\
                                        <Rotation>Rotation0</Rotation>\
                                        <IsMirrored>False</IsMirrored>\
                                        <IsVariable>True</IsVariable>\
                                        <HorizontalAlignment>Center</HorizontalAlignment>\
                                        <VerticalAlignment>Middle</VerticalAlignment>\
                                        <TextFitMode>AlwaysFit</TextFitMode>\
                                        <UseFullFontHeight>True</UseFullFontHeight>\
                                        <Verticalized>False</Verticalized>\
                                        <StyledText />\
                                    </TextObject>\
                                    <ObjectMargin Left="0" Top="0" Right="0" Bottom="0" />\
                                    <Length>0</Length>\
                                    <LengthMode>Auto</LengthMode>\
                                    <BorderWidth>0</BorderWidth>\
                                    <BorderStyle>Solid</BorderStyle>\
                                    <BorderColor Alpha="255" Red="0" Green="0" Blue="0" />\
                                </RootCell>\
                            </ContinuousLabel>';
            return labelXml;
        }

        // load labels from the xml
        function loadLabels()
        {
            // Get DZ Label
            DZLabel = dymo.label.framework.openLabelXml(getDZLabelXml());

            // Get Address Label
            addressLabel = dymo.label.framework.openLabelXml(getAddressLabelXml());

            // Get Tap Label
            tapeLabel = dymo.label.framework.openLabelXml(getTapeLabelXml());
        }

         
        // load settings from cookies
        function loadSettings()
        {
            settings.load();

            // update printer uris
            for (var i = 0; i < settings.printerUris.length; ++i)
            {
                var printerUri = settings.printerUris[i];
                dymo.label.framework.addPrinterUri(printerUri, '',
                    updatePrinters,
                    function() {alert('Unable to contact "' + printerUri + '"');});
            }


            //fixedLabelLengthCheckBox.checked = settings.isFixedLabelLength;
            //fixedLabelLengthTextBox.value = settings.fixedLabelLength;
            //fixedLabelLengthTextBox.disabled = !settings.isFixedLabelLength;
            //printerIpAddressTextBox.value = settings.printerIpAddress;
        }
        

        /*
        fixedLabelLengthCheckBox.onclick = function()
        {
            fixedLabelLengthTextBox.disabled = !fixedLabelLengthCheckBox.checked;
        }
        
        labelSettingsButton.onclick = function()
        {
            if (labelSettingsDiv.style.display == 'none')
                labelSettingsDiv.style.display = 'block';
            else
                labelSettingsDiv.style.display = 'none';    
        }
        */

        printerSettingsButton.onclick = function()
        {
            if (printerSettingsDiv.style.display == 'none')
                printerSettingsDiv.style.display = 'block';
            else
                printerSettingsDiv.style.display = 'none'; 
        }

        printButton.onclick = function()
        {
            try
            {
                printButton.disabled = true;

                settings.currentPrinterName = printersComboBox.value;

                var text = document.getElementById('labelTextArea').value;

                var printer = printers[settings.currentPrinterName];
                if (!printer)
                    throw new Error("Select printer");

                // determine what label to print based on printer type
                var label = null;
                var objName = "";
                if (printer.printerType == "LabelWriterPrinter")
                {
                    label = addressLabel;
                    objName = "Address";
                }
                else if (printer.printerType == "DZPrinter")
                {
                    label = DZLabel;
                    objName = "Text";
                }
                else
                {
                    label = tapeLabel;
                    objName = "Text";
                }

                if (!label)
                    throw new Error("Label is not loaded. Wait until is loaded or reload the page");

                // set data
                // Because Android does not support XPath (that is needed for setObjectText)
                // we will use LabelSet instead
                //label.setObjectText(objName, text);
                var labelSet = new dymo.label.framework.LabelSetBuilder();
                labelSet.addRecord().setText(objName, text);

                // print
                //label.print(printer.name, null, labelSet.toString());
                // print and get status
                var printJob = label.printAndPollStatus(printer.name, null, labelSet.toString(), function(printJob, printJobStatus)
                {
                    // output status
                    var statusStr = 'Job Status: ' + printJobStatus.statusMessage;

                    var result = (printJobStatus.status != dymo.label.framework.PrintJobStatus.ProcessingError 
                        && printJobStatus.status != dymo.label.framework.PrintJobStatus.Finished);

                    // reenable when the job is done (either success or fail)
                    printButton.disabled = result;

                    //if (!result)
                    //    statusStr = '';

                    setTextContent(jobStatusMessageSpan, statusStr);

                    return result;
                    
                }, 1000);

                
                saveSettings();
            }
            catch(e)
            {
                printButton.disabled = false;
                alert(e.message || e);
            } 
        }

        addPrinterUriButton.onclick = function()
        {
            try
            {
                var printerUri = printerUriTextBox.value;
                if (!printerUri)
                    throw new Error("Specify printer Url");

                dymo.label.framework.addPrinterUri(printerUri, '',
                    function()
                    {
                        settings.printerUris.push(printerUri);
                        saveSettings();
                        updatePrinters();
                    },
                    function() 
                    {
                        alert('Unable to connect to "' + printerUri + '"');
                    }
                );

            }
            catch(e)
            {
                alert(e.message || e);
            }
        }
        
        clearPrinterUriButton.onclick = function()
        {
            dymo.label.framework.removeAllPrinterUri();
            settings.printerUris = [];
            saveSettings();
            updatePrinters();
        }

        // setup controls
        loadLabels();
        loadSettings();
        updatePrinters();  // for local printers


        //fixedLabelLengthCheckBox.isChecked = false;
        //fixedLabelLengthTextBox.disabled = true;
        //labelSettingsDiv.style.display='none';
        //printerSettingsDiv.style.display= !settings.printerIpAddress ? 'block' : 'none';
    };

   function initTests()
  {
    if(dymo.label.framework.init)
    {
      //dymo.label.framework.trace = true;
      dymo.label.framework.init(onload);
    } else {
      onload();
    }
  }

  // register onload event
  if (window.addEventListener)
    window.addEventListener("load", initTests, false);
  else if (window.attachEvent)
    window.attachEvent("onload", initTests);
  else
    window.onload = initTests;

} ());