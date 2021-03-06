window.addEventListener("load", function() {
  console.log("Hello World!");
  
  document.getElementById("btn_gen").onclick = generate_scheme;
});

function generate_scheme() {
  console.log("generate_scheme: enter");

  var out = "";
  
  do {
   var scheme = new Scheme();
    
   scheme.areaCenterW = parseInt(document.getElementById("area_center_w").value);
   scheme.areaCenterH = parseInt(document.getElementById("area_center_h").value);
   scheme.areaExtraH = parseInt(document.getElementById("area_extra_h").value);
   scheme.areaCenterR = document.getElementById("area_center_r").value;
   scheme.areaExtraR = document.getElementById("area_extra_r").value;
   scheme.areaExtraSymmetric = document.getElementById("area_extra_symmetric").checked;
   scheme.inputR = document.getElementById("input_r").value;
   scheme.outputR = document.getElementById("output_r").value;
   scheme.schemeType = document.getElementById("scheme_type").value;
    
   out = scheme.generate();
   
  } while (false);
  
  document.getElementById("scheme").innerHTML = out;
  
  
}

function Scheme() {

  this.areaCenterW = 0;
  this.areaCenterH = 0;
  this.areaExtraH = 0;
  this.areaCenterR = 0;
  this.areaExtraR = 0;
  this.areaExtraSymmetric = false;
  this.areaWholeH = 0;
  this.rowMax = 0;
  this.inputR = 0;
  this.outputR = 0;
  this.schemeType = "";

  this.SCHEME_NORMAL = "normal";
  this.SCHEME_INPUT = "input";
  this.SCHEME_SEQUENTIAL = "sequential";
  
  this.ZERO = "0";
  this.INPUT = "input";
  this.OUTPUT = "output";
  this.SOURCE = "source";
  
  this.nodes = new Map();
  this.lastNodeIdx = -1;
  
  this.nodes.set(this.ZERO, ++this.lastNodeIdx);
  this.nodes.set(this.SOURCE, ++this.lastNodeIdx);
  this.nodes.set(this.INPUT, ++this.lastNodeIdx);
  this.nodes.set(this.OUTPUT, ++this.lastNodeIdx);
  
  this.nodeOut = this.OUTPUT;
  
  this.output = "";
  
  this.generate = function() {
    this.areaWholeH = this.areaCenterH + 2 * this.areaExtraH;

    this.output += "* schemeType: " + this.schemeType + "\n\n";
    
    
    // setup for scheme type
    nodeSourceBase = this.ZERO;
    
    if (this.schemeType == this.SCHEME_INPUT) {
      this.nodeOut = this.INPUT;
    } else if (this.schemeType == this.SCHEME_SEQUENTIAL) {
      nodeSourceBase = this.OUTPUT;
    }
    
    // source 
    this.output += "\nVg " + this.SOURCE + " " + nodeSourceBase + " AC 1";
    // input resistor
    //this.output += "\nRg " + this.nodes.get(this.SOURCE) + " " + this.nodes.get(this.INPUT) + " " + this.inputR;
    this.output += "\nRg " + this.SOURCE + " " + this.INPUT + " " + this.inputR;
    
    this.output += "\n\n";

    this.rowMax =  this.areaExtraSymmetric ? this.areaWholeH : this.areaCenterH + this.areaExtraH;
    
    for (var row = 0; row < this.rowMax; row++) {
      for (var col = 0; col < this.areaCenterW; col++) {
        var cellNodeIdx = this.getNodeIdx(row, col, 0, 0);
        
        for (var dirRow = -1; dirRow <= 1; dirRow++) {
          for (var dirCol = -1; dirCol <= 1; dirCol++) {
            if (dirRow !== 0 && dirCol !== 0) {
              continue;
            }
            
            if (dirRow === 0 && dirCol === 0) {
              continue;
            }
            
            var curNodeIdx = this.getNodeIdx(row, col, dirRow, dirCol);
            
            if (curNodeIdx === undefined) {
              continue;
            }
            
            // plain resistor
            this.output += "\nR" + cellNodeIdx + this.getDirCode(dirRow, dirCol) + " " + cellNodeIdx + " " + curNodeIdx + " ";
            
            
            if (row >= this.areaExtraH && row < this.areaExtraH + this.areaCenterH) {
              this.output += this.areaCenterR;
            } else {
              this.output += this.areaExtraR;
            }
          }
        }
      }
    }
    
    this.output += "\n\n";
    
    // output resistor
    if (this.schemeType == this.SCHEME_NORMAL) {
      this.output += "\nRout " + this.OUTPUT + " " + this.ZERO + " " + this.outputR;
    }
    
    this.output += "\n\n";
    
    
    return this.output;
  }
  
  this.getNodeIdx = function(cellRow, cellCol, dirRow, dirCol) {
    var out = undefined;
    
    do {
      if (cellRow < 0 || cellRow >= this.areaWholeH || cellRow >= this.rowMax) { // invalid cell row
        console.log("Scheme::getNodeIdx: invalid cell row:" + cellRow);
        break;
      }
      

      if (cellCol < 0 || cellCol >= this.areaCenterW) { // invalid cell column
        console.log("Scheme::getNodeIdx: invalid cell col:" + cellCol);
        break;
      }
      
      if (dirRow != 0 && dirRow != 1 && dirRow != -1) { // invalid row direction
        console.log("Scheme::getNodeIdx: invalid row dir:" + dirRow);
        break;
      }
      
      if (dirCol != 0 && dirCol != 1 && dirCol != -1) { // invalid column direction
        console.log("Scheme::getNodeIdx: invalid col dir:" + dirCol);
        break;
      }
      
      if (dirRow != 0 && dirCol != 0) { // invalid direction
        console.log("Scheme::getNodeIdx: invalid dir:(" + dirRow + ", " + dirCol+ ")");
        break;
      }
      
      var nodeName = undefined;

      // calculate node name
      do {
        if (cellCol === 0 && dirCol < 0) { // leftmost column, direction to the left
          if (cellRow < this.areaExtraH || cellRow >= this.areaExtraH + this.areaCenterH) {
            // no node
            break;
          }
          
          nodeName = this.INPUT;
          break;
        }
        
        if (cellCol === this.areaCenterW - 1 && dirCol > 0) { // rightmost column, direction to the right
          if (cellRow < this.areaExtraH || cellRow >= this.areaExtraH + this.areaCenterH) {
            // no node
            break;
          }
          
          nodeName = this.nodeOut;
          break;
        }
        
        if (cellRow === 0 && dirRow < 0) { // topmost row, direction to the up
          nodeName = this.ZERO;
          break;
        }
        
        if (cellRow === this.areaWholeH - 1 && dirRow > 0) { // bottommost row, direction to the bottom
          nodeName = this.ZERO;
          break;
        }
        
        if (cellRow === this.rowMax - 1 && dirRow > 0) { // bottommost row, direction to the bottom
          break;
        }
        
        if (dirRow === 0 && dirCol === 0) { // the cell itself
          nodeName = "" + cellRow + "x" + cellCol;
          break;
        }
        
        var nameCellRow = dirRow >= 0 ? cellRow : cellRow - 1;
        var nameCellCol = dirCol >= 0 ? cellCol : cellCol - 1;
        
        nodeName = "" + nameCellRow + "x" + nameCellCol;
        
        if (dirRow !== 0) {
          nodeName += "d";
        } else if (dirCol !== 0) {
          nodeName += "r";
        }
            
      } while (false);
      
      if (nodeName === undefined) { // no node
        console.log("Scheme::getNodeIdx: no node at:(" + cellRow + ", " + cellCol + ")-(" + dirRow + ", " + dirCol+ ")");
        break;
      }

      console.log("Scheme::getNodeIdx: assigned:(" + cellRow + ", " + cellCol + ")-(" + dirRow + ", " + dirCol+ ") name[" + nodeName + "]");
/*      
      var nodeIdx = this.nodes.get(nodeName);

      if (nodeIdx === undefined) { // not allocated yet
        nodeIdx = ++this.lastNodeIdx;
        this.nodes.set(nodeName, nodeIdx);
        console.log("Scheme::getNodeIdx: assigned:(" + cellRow + ", " + cellCol + ")-(" + dirRow + ", " + dirCol+ ") name[" + nodeName + ") idx[" + nodeIdx + "]");
      }

      out = nodeIdx;
*/
      out = nodeName;
    } while (false);
    
    return out;
  }
  
  this.getDirCode = function(dirRow, dirCol) {
    var out = "";
    
    if (dirRow < 0) {
      out = "u";
    } else if (dirRow > 0) {
      out = "d";
    } else if (dirCol < 0) {
      out = "l";
    } else if (dirCol > 0) {
      out = "r";
    }
    
    return out;
  }
  
}
