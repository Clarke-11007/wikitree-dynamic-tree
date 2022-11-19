/*
 * The WikiTree Dynamic Tree Viewer itself uses the D3.js library to render the graph.
 * FanDoku game uses the D3 function for zooming and panning, but customizes the positioning of each leaf in the tree.
 
* There is a Button Bar TABLE at the top of the container, 
 * then the SVG graphic is below that.
 * 
 * The FIRST chunk of code in the SVG graphic are the <path> objects for the individual wedges of the FanDoku game,
 * each with a unique ID of wedgeAnB, where A = generation #, and B = position # within that generation, counting from far left, clockwise
 * 
 * The SECOND chunk in the SVG graphic are the individual people in the FanDoku game, created by the Nodes and the d3 deep magic
 * they are each basically at the end of the day a <g class"person ancestor" transformed object with a translation from 0,0 and a rotation></g>
 * 
 * The Button Bar does not resize, but has clickable elements, which set global variables in the XCousins, then calls a redraw
 */
(function () {
    var originOffsetX = 500,
        originOffsetY = 300,
        boxWidth = 200 * 2,
        boxHeight = 50,
        nodeWidth = boxWidth * 1.5,
        nodeHeight = boxHeight * 2;

    /**
     * Constructor
     */
    var XCousins = (window.XCousins = function () {
        Object.assign(this, this?.meta());
    });


    XCousins.prototype.meta = function () {
        return {
            title: "X-chromosome Cousins",
            description: "Choose WikiTree ID or GEDcom to start, then investigate to find all your potential X-chromosome cousins.",
            docs: "https://www.WikiTree.com/wiki/Dynamic_Tree",
        };
    };

    XCousins.prototype.init = function (selector, startId) {
        // console.log("XCousins.js - line:18", selector) ;
        var container = document.querySelector(selector),
            width = container.offsetWidth,
            height = container.offsetHeight;

        var self = this;

        var btnBarHTML =
            '<table border=0 style="background-color: #f8a51d80;" width="100%"><tr>' +
            '<td width="30%">' +
            "&nbsp;" +
            //  '<A onclick="XCousins.maxAngle = 360; XCousins.redraw();"><img height=20px src="https://apps.wikitree.com/apps/clarke11007/pix/fan360.png" /></A> |' +
            //  ' <A onclick="XCousins.maxAngle = 240; XCousins.redraw();"><img height=20px src="https://apps.wikitree.com/apps/clarke11007/pix/fan240.png" /></A> |' +
            //  ' <A onclick="XCousins.maxAngle = 180; XCousins.redraw();"><img height=20px src="https://apps.wikitree.com/apps/clarke11007/pix/fan180.png" /></A></td>' +
            "</td>" +
            '<td width="5%">&nbsp;</td>' +
            '<td width="30%" align="center">' +
            ' <A onclick="XCousins.numGens2Display -=1; XCousins.redraw();"> -1 </A> ' +
            "[ <span id=numGensInBBar>3</span> generations ]" +
            ' <A onclick="XCousins.numGens2Display +=1; XCousins.redraw();"> +1 </A> ' +
            "</td>" +
            '<td width="5%">&nbsp;</td>' +
            '<td width="30%" align="right">' +
            ' <A onclick="XCousins.toggleSettings();"><font size=+2>' +
            "</font></A>" +
            "&nbsp;&nbsp;</td>" +
            '</tr></table><DIV id=WarningMessageBelowButtonBar style="text-align:center; background-color:yellow;">Please wait while initial Fractal Tree is loading ...</DIV>';

        var bodyHTML = `	<div align="center">

<div id=XFriendsExplainer><table  style="background-color: beige;border-color: beige;"><TR>
          <TD colspan=2>The X-Chromosome Friend Finder app will <UL><LI>start with a single ROOT individual (at or near the bottom of a family tree),<LI>then traverse upwards through their tree (back in time) to find all potential ancestors who could have donated part of their X-Chromosome<LI>then will travel back down through the tree and spread out to eventually find all possible cousins who could potentially share some portion of the same X-Chromosome.</UL><P>NOTE: You must specify a maximum number of generations to go back in time.<P>There are two ways to generate this list of X-Friends:</TD>
          
        </TR><TR style="padding: inherit; background-color:beige;" colspan=2><td align="center">
        	<table style="border:  5px solid beige;"><tr>
          <TD style="padding: 20px; background-color: white;border:  5px solid beige;">
<I>OPTION # 1</I><BR><BR>
Enter the <a target="_blank" href="https://www.wikitree.com/wiki/Help:WikiTree_ID">WikiID</a> for the initial person in the X-Chromosome Friend Finder,<br>to create a list of X-Chromosome ancestors and descendant test-takers.<br><br></p>
<p><b>Initial Person:</b> <input type="text" name="id" id="Person1" value=""><br><i>e.g. Marcoux-336</i><br></p><b>How far back do you wish to go?:</b> &nbsp;<a class="noUnderline" onclick="decStepper(&quot;numGensStepper&quot;)"><span id="numGensStepperDEC"><font color="blue">◀</font></span></a> <span id="numGensSteppervalue">5</span> generations<a class="noUnderline" onclick="incStepper(&quot;numGensStepper&quot;)"><span id="numGensStepperINC"><font color="red">▶</font></span></a>&nbsp;
<p></p><input type="hidden" name="NumGens" value="5"><input type="hidden" name="ph" value="1"><input type="hidden" name="TheWidth" value="1000"><input type="hidden" name="TheHeight" value="1000"><br><input class="button" type="submit" onclick="loadInitialRecords(true);" value="Find X-Chromosome Friends on WikiTree"><br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;


          </TD>
          <TD style="padding: 20px; background-color: white;border-color: beige;" valign=top>
          	<I>OPTION # 2</I><BR><BR>
          	<!-- <B> - OR - </B><br/><br/>&#x1F4C1;<BR><button onclick="gotoGEDcom();">Import a GEDcom file</button><BR>which contains the Family Tree information required. -->
          	Import a GEDcom file which contains the Family Tree information required.<BR><BR><BR><BR>
          	<input style="padding:3px 10px; font-size:20px; background-color: green; color: white; width: 400px;" type='file' accept='*.GED' onchange='openFile(event)'><br><br><br>
          	<button onclick="processGEDcom();">Process GEDcom file</button>
          </TD>
        </TR>
        </tr></table> </TD></TR>
      </table><BR/><BR/>
  </div>

  <div id='GEDcomParmsDIV'></div>
		<div id=LoadingHeader></div><svg id=TickerTape></svg><div id=LoadingMessage></div>

    <div id='Individuals'></div>
		<div id="AppInfo">XFriends info goes here</div><BR>
		<svg id="SVGchart" style="background-color:none;"></svg>
	</div>

	<div class=popupBox id='mydiv'>
			<div id='mydivheader' align=left style='display:block;'>
				<div align=left width=1 id=xxx onclick='closeFloater();' style='background-color: red; display:inline-block; font-family: sans-serif;'>&nbsp;x&nbsp;</div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				</div>
				<div align=right width=10px id=PIN onclick='unPin();' style='background-color: DarkOrange; transform-origin:50%; transform:rotate(45deg); display:inline-block; font-family: sans-serif; color:#0000FF;  border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-radius: 20px;'>T</div>
				<div id='mydivcontent'><B>Click or Rollover someone's name.</B>
				<BR/><I>Click again to pin or unpin an ancestor.</I><BR/>
					<BR/><A >Wiki ID link will take you to their WikiTree profile</A>
					<BR/>
					<BR/>b. Birthdate, Birth Place
					<BR/>d. Date of Death, Place of Death
					<BR/><A><IMG src=pix/fan240.png height=20px></A>
					<BR/><I>Click fan icon to view new Fan Chart</I>
			</div>
	</div>
		<div id="dnaTestComparator">
		<div id="dtcCloser" onClick="dtcCloseComparator()">X</div>
		<div id="dtcSectionContainer"></div>
		<div id="dtcStatus"></div>
		<div id="dtcManualSection">
			<span id="dtcCloseManualButton" onClick="dtcManuallyAddTest(\\'close\\');">X</span>
			<input type="text" class="small" name="dtcManualAddTestId" id="dtcManualAddTestId" value="" size=10>
			<input type="hidden" name="dtcManualAddTestName" id="dtcManualAddTestName" value="">
			<div class="dtcManualPlaceholder" id="dtcManualPlaceholder" data-test-id="" data-test-name=""></div>
			<input type="button" class="button small" name="dtcManualAddButton" id="dtcManualAddButton" value="Add" onClick="dtcDoManuallyAddTest();">
		</div>
		<div id="dtcSectionButtonBox" class="small"></div>
		<span id="dtcHelpButton" class="small">[<a href="/wiki/Help:DNA_Comparison" target="_Help" title="Click here for help on DNA test comparisons">help</a>]</span>
	</div>`;    
        container.innerHTML = btnBarHTML + bodyHTML;

        
    };


} ) ();
