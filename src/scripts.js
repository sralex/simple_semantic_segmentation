var shapes = {};
var count_shapes = 0 ;
var history_undo = []
var history_redo = []

var isMouseDown = false;
var SelectedNodes = new Array();
var SelectedNodesOriginalCoord = new Array();
var SelectedNode = null;
var SelectedNodeOriginalCoord = null;
var SelectedPointOriginalCoord = null;
var DragSelectedShape = null;
var SelectedShape = null;
var ShapeOfSelectedNode = null;
var ToManipulateNodesOriginalCoord = new Array();
var history_drag_shape_locked = false;
var history_move_node_locked = false;
var shapes_order = []
var shape;
var canvas = document.getElementById("main_canvas");
var ctx = canvas.getContext("2d");
var img = new Image();

// https://www.wikitechy.com/technology/how-to-check-if-two-given-line-segments-intersect/
// Given three colinear points p, q, r, the function checks if
// point q lies on line segment 'pr'

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are colinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p,q,r)
{
    // See http://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    var val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val == 0) return 0;  // colinear
    return (val > 0)? 1: 2; // clock or counterclock wise
}
 
// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
function check_line_intersect(p1, q1, p2, q2)
{
    // Find the four orientations needed for general and
    // special cases
    var o1 = orientation(p1, q1, p2);
    var o2 = orientation(p1, q1, q2);
    var o3 = orientation(p2, q2, p1);
    var o4 = orientation(p2, q2, q1);
 
    // General case
    if (o1 != o2 && o3 != o4)
        return true;
 
    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;
    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;
     // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;
    return false; // Doesn't fall in any of the above cases
}
function onSegment(p,q,r)
{
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
       return true;
    return false;
}

function check_dot_intersect_line(x,y,p2,q2,margin){
        var p1 = {"x":x,"y":y}
        var q1 = {"x":x + 5000000,"y":y}

        var dy = p2.y - q2.y;
        var dx = p2.x - q2.x;
        var theta = Math.atan(dy/dx) //* 180/pi
        var angle  = (90 + theta)
        
        var y_theta = (Math.sin(angle) * margin)
        var x_theta = (Math.cos(angle) * margin)

        var points = [{"x": p2.x + x_theta,"y":p2.y + y_theta},
                        {"x": p2.x - x_theta,"y":p2.y - y_theta},
                        {"x": q2.x + x_theta,"y":q2.y + y_theta},
                        {"x": q2.x - x_theta,"y":q2.y - y_theta}]
        var times = 0;
        for(var k = 0; k < points.length - 1; k ++){
            if(check_line_intersect(p1, q1, points[k], points[k + 1])){
                times +=1;
            }
        }
        //check last case, first and last node...
        if(check_line_intersect(p1, q1, points[0], points[points.length - 1])){
            times +=1;
        }
        return times;
}


function check_add_node_in_shapes(x,y,shapes){
    var margin = 5;
    for (var i in shapes) {
        var path = shapes[i].path;
        for(var j=0; j< path.length - 1; j++){
            //make a shape.... and add margin....
            if(check_dot_intersect_line(x,y,path[j],path[j+1],margin) % 2 != 0 ){
                return {"i":i,"j":j};
            }
        }
        /// craete four points of virtual shape...
        if(path.length>0){
            if(check_dot_intersect_line(x,y,path[path.length - 1],path[0],margin) % 2 != 0 ){
                return {"i":i,"j":j};
            }
        }
    }
    return null;
}

function update_history(shapes,history_undo,history_redo){
    // set selected shapes
    console.log(shapes)
    var shapes_tmp = JSON.parse(JSON.stringify(shapes));
    setWhitePath(shapes_tmp);
    history_undo.push(shapes_tmp);
    history_redo = []
}

function setWhitePath(shapes){
    for(var i in shapes){
        for(var j = 0 ; j < shapes[i].path.length ; j++){
            shapes[i].path[j].fillStyle = "white";
        }
    }
}

function make_point(ctx,p){
    ctx.fillStyle = p.fillStyle;
    ctx.lineWidth = 0;
    ctx.fillRect(p.x-3,p.y-3,6,6);
    ctx.moveTo(p.x,p.y);
}

function update(ctx,canvas,shapes){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(img!=null)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    ctx.lineCap = "square";
    
    for (var i in shapes) {
        ctx.strokeStyle = "white";
        ctx.beginPath();

        if(shapes[i].path.length > 0){
            make_point(ctx,shapes[i].path[0]);
        }
        for(var j = 1; j < shapes[i].path.length; j++){
            if(shapes[i].complete){
                make_point(ctx,shapes[i].path[j]);
            }
        }
        if(shapes[i].path.length > 0){
            ctx.moveTo(shapes[i].path[0]['x'],shapes[i].path[0]['y']);
        }
        ctx.lineWidth = 1;
        for(var j = 1; j < shapes[i].path.length; j++){
            ctx.lineTo(shapes[i].path[j]['x'],shapes[i].path[j]['y']);
        }

        if(shapes[i].complete){
            console.log("completed");
            ctx.lineTo(shapes[i].path[0]['x'],shapes[i].path[0]['y']);
            
            ctx.fillStyle = shapes[i].fillStyle;
            ctx.strokeStyle = 'black';
            ctx.fill();
            ctx.closePath();
        }
        ctx.stroke();
    }
}

function check_shape_intersection(x,y,shapes){
    // defining line
    p1 = {"x":x,"y":y}
    q1 = {"x":x + 5000000,"y":y}
    for (var i in shapes) { 
        var times = 0;
        for(var j=0; j<shapes[i].path.length - 1; j++){
            if(check_line_intersect(p1, q1, shapes[i].path[j], shapes[i].path[j+1])){
                times +=1;
            }
        }
        //check last case, last and first node ...
        if(shapes[i].path.length > 1){
            if(check_line_intersect(p1, q1, shapes[i].path[shapes[i].path.length - 1], shapes[i].path[0])){
                times +=1;
            }
        }
        if ( times % 2 != 0 ){
            console.log("times: "+times)
            return i;
        }
    }
    return null;
}


function node_intersected(x,y,shapes){
    for (var i in shapes) {
        for(var j=0; j<shapes[i].path.length; j++){
            x_ = shapes[i].path[j]['x'];
            y_ = shapes[i].path[j]['y'];
            if( x > x_ - 10 && x < x_ +10 && y > y_ - 10 && y < y_ + 10){
                return {"i":i,"j":j};
            }
        }
    }
    return null;
}

img.onload = function(){
    canvas.setAttribute('width', img.width);
    canvas.setAttribute('height', img.height); 
    ctx.drawImage(img, 0, 0, img.width, img.height);
    update(ctx,canvas,shapes);
}

function init(url){
    img.src = url; 
    maquina.lanzar("iniciar");
}

function change_mask_color(shape){
    console.log("changed mask");
    update_history(shapes,history_undo,history_redo);
    var e = document.getElementById("mask");
    var color_mask = e.options[e.selectedIndex].value;
    shape.fillStyle = color_mask;
    shape.tag = e.options[e.selectedIndex].text;
}

///////// state machine imp

maquina = new MaquinaEstados();


maquina.en(0).cuando("mouse_down").ejecutar(function(){
    var rect, x, y;
    rect = canvas.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
    SelectedShape = check_shape_intersection(x,y,shapes);
    var element = document.getElementById("selected_shape");
    element.innerHTML = (SelectedShape != null)? shapes[SelectedShape].tag : "" ;
    if(shapes[SelectedShape]!=undefined)
        document.getElementById("mask").value = shapes[SelectedShape].fillStyle;
});

maquina.en(0).cuando("drag_mode").irA(1);
maquina.en(1).cuando("edit_mode").irA(3);
maquina.en(1).cuando("normal_mode").irA(0);
maquina.en(1).cuando("mouse_down").ejecutar(function(){
    //verify if a shape was selected and save it....
    var rect, x, y;

    rect = canvas.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;

    SelectedPointOriginalCoord = {"x":x,"y":y};

    DragSelectedShape = check_shape_intersection(x,y,shapes);
    SelectedShape = DragSelectedShape;
    console.log("selected shape:" + DragSelectedShape);
}).irA(2);


maquina.en(2).cuando("mouse_up").ejecutar(function(){
    DragSelectedShape = null;
    ToManipulateNodesOriginalCoord = new Array();
    history_drag_shape_locked = false;
}).irA(1);


maquina.en(2).cuando("mouse_move").ejecutar(function(){
    // if shape is selected, thus, it is updated with a new coordinates
    if(DragSelectedShape!=null){ // validamos que si este moviendo algo....
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        //hay que ver la diferencia entre el mouse down point y este, luego sumarlo a todos
        //coordenadas
        //quiere decir que va a empezar a mover una figura ...
        if(!history_drag_shape_locked){
            update_history(shapes,history_undo,history_redo);
            console.log("saving point")
            history_drag_shape_locked = true;
        }
        if(ToManipulateNodesOriginalCoord.length != shapes[DragSelectedShape].path.length ){
            for(var i = 0 ; i < shapes[DragSelectedShape].path.length ; i++){
                ToManipulateNodesOriginalCoord.push({"x":shapes[DragSelectedShape].path[i].x,"y":shapes[DragSelectedShape].path[i].y});
            }
        }
        var x_diff = x - SelectedPointOriginalCoord.x;
        var y_diff = y - SelectedPointOriginalCoord.y;
        for(var i = 0; i < shapes[DragSelectedShape].path.length; i++){
                shapes[DragSelectedShape].path[i].x = ToManipulateNodesOriginalCoord[i].x + x_diff
                shapes[DragSelectedShape].path[i].y = ToManipulateNodesOriginalCoord[i].y + y_diff
        }
        update(ctx,canvas,shapes);
    }
});

maquina.en(0).cuando("edit_mode").irA(3);

maquina.en(3).cuando("mouse_down").ejecutar(
    function(){
    var rect, x, y;
    rect = canvas.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
    console.log("mouse down")
    var indexes = node_intersected(x,y,shapes);
    console.log(indexes);
    
    SelectedShape = check_shape_intersection(x,y,shapes);
    var element = document.getElementById("selected_shape");
    element.innerHTML = (SelectedShape != null)? shapes[SelectedShape].tag : "" ;
    if(shapes[SelectedShape]!=undefined)
        document.getElementById("mask").value = shapes[SelectedShape].fillStyle;


    if(indexes!=null){
        SelectedNode = shapes[indexes["i"]].path[indexes["j"]];
        SelectedNodeOriginalCoord = {"x":SelectedNode.x,"y":SelectedNode.y};
        console.log("node_i: "+indexes["j"]);

        for(var i= 0 ; i< SelectedNodes.length; i++){
            if(SelectedNodes[i].x == SelectedNode.x && SelectedNodes[i].y == SelectedNode.y)
                return;
        }
        if(event.ctrlKey){
                SelectedNode["fillStyle"] = "#03A9F4"
                SelectedNodes.push(SelectedNode);
        }
        else{
            var node;
            while(SelectedNodes.length > 0){
                Node = SelectedNodes.pop()
                Node["fillStyle"] = "white"
            }
            SelectedNode["fillStyle"] = "#03A9F4"
            SelectedNodes.push(SelectedNode);
        }
        ShapeOfSelectedNode = indexes["i"]
    }else{
        while(SelectedNodes.length > 0){
            var Node = SelectedNodes.pop()
            Node["fillStyle"] = "white"
        }
        var indexes = check_add_node_in_shapes(x,y,shapes);
        if(indexes!=null){
            update_history(shapes,history_undo,history_redo);
            console.log("updateing historial specific point")
            var new_node = {'x':x,'y':y,"fillStyle":"white"}
            shapes[indexes["i"]].path.splice(indexes["j"] +1 ,0,new_node);
            SelectedNode = new_node;
            SelectedNodeOriginalCoord = {"x":SelectedNode.x,"y":SelectedNode.y};
            SelectedNode["fillStyle"] = "#03A9F4";
            SelectedNodes.push(SelectedNode);
        }
    }
    update(ctx,canvas,shapes)
}).irA(5);

maquina.en(5).cuando("mouse_move").ejecutar(
    function(){
    if(SelectedNodes.length > 0){
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        // we are moving one or more nodes ...
        //start moving...
        //si no tenemos los nodos originales, los vamos guardando
        // if there are no original nodes, we will save them
        if(SelectedNodesOriginalCoord.length != SelectedNodes.length){
            for(var i = 0 ; i < SelectedNodes.length; i++){
                SelectedNodesOriginalCoord.push({"x":SelectedNodes[i].x,"y":SelectedNodes[i].y});
            }
        }
        if(!history_move_node_locked){
            update_history(shapes,history_undo,history_redo);
            console.log("saving point")
            history_move_node_locked = true;
        }
        console.log("Draging");
        var x_diff = x - SelectedNodeOriginalCoord.x;
        var y_diff = y - SelectedNodeOriginalCoord.y;
        if(SelectedNodes.length > 0){
            for(var i = 0; i < SelectedNodes.length; i++){
                    SelectedNodes[i].x = SelectedNodesOriginalCoord[i].x + x_diff
                    SelectedNodes[i].y = SelectedNodesOriginalCoord[i].y + y_diff
            }
        }
        update(ctx,canvas,shapes);
    }
});
maquina.en(3).cuando("normal_mode").irA(0);
maquina.en(3).cuando("drag_mode").irA(1);
maquina.en(5).cuando("mouse_up").ejecutar(function(){
    SelectedNodesOriginalCoord = new Array();
    history_move_node_locked = false;
}).irA(3);

maquina.en(0).cuando("add_mask").ejecutar(function(){
    //remove selected
    update_history(shapes,history_undo,history_redo);
    console.log("saving point");
    var e = document.getElementById("mask");

    var color_mask = e.options[e.selectedIndex].value;

    complete = false;
    shape = {"path":new Array(),"fillStyle":color_mask,"tag":e.options[e.selectedIndex].text,"complete":false};
    shapes[""+count_shapes+""] = shape;
    count_shapes+=1;
}).irA(7);

maquina.en(7).cuando("mouse_down").ejecutar(function(){
    var rect, x, y;
    rect = canvas.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
    var indexes = node_intersected(x,y,shapes);
    if (indexes != null){
        if (indexes["j"] == 0 && !shapes[indexes["i"]].complete){ // quiere decir que le dimos click al primero // verificar que si se este en modo de agregar poligono
            shape.complete = true;
            update(ctx,canvas,shapes);
            maquina.lanzar("finish_mask");
            return false;
        }
    }
    if (shape.length>0 && x == shape[shape.length-1]['x'] && y == shape[shape.length-1]['y']){
        return false;
    }
    shape.path.push({'x':x,'y':y,"fillStyle":"white"});
    update(ctx,canvas,shapes);
});
maquina.en(7).cuando("finish_mask").irA(0);
maquina.en(0).ejecutar().alEntrar(function(){
    SelectedShape = null;
});

maquina.en(3).cuando("changed_mask").ejecutar(function(){
    console.log("changed mask");
    if(SelectedShape!=null){
        change_mask_color(shapes[SelectedShape]);
        update(ctx,canvas,shapes);
    }
});
maquina.en(7).cuando("changed_mask").ejecutar(function(){
    change_mask_color(shape);
    update(ctx,canvas,shapes);
});

//undo and redo
maquina.en(0).cuando("undo").ejecutar(function(){
    undo_history(history_undo,history_redo);
    update(ctx,canvas,shapes);
});
maquina.en(0).cuando("redo").ejecutar(function(){
    redo_history(history_undo,history_redo);
    update(ctx,canvas,shapes);
});
maquina.en(3).cuando("undo").ejecutar(function(){
    undo_history(history_undo,history_redo);
    update(ctx,canvas,shapes);
});
maquina.en(3).cuando("redo").ejecutar(function(){
    redo_history(history_undo,history_redo);
    update(ctx,canvas,shapes);
});
maquina.en(1).cuando("undo").ejecutar(function(){
    undo_history(history_undo,history_redo);
    update(ctx,canvas,shapes);
});
maquina.en(1).cuando("redo").ejecutar(function(){
    redo_history(history_undo,history_redo);
    update(ctx,canvas,shapes);
});

maquina.en(7).cuando("undo").ejecutar(function(){
    shape.path.pop();
    update(ctx,canvas,shapes);
});
maquina.en(7).cuando("redo").ejecutar(function(){

});

maquina.en(100).cuando("iniciar").irA(0);

maquina.en(0).ejecutar().alEntrar(function(){
    change_normal_buttons(true);
});
maquina.en(0).ejecutar().alSalir(function(){
    change_normal_buttons(false);
});
maquina.en(1).ejecutar().alEntrar(function(){
    change_drag_buttons(true);
});

maquina.en(1).ejecutar().alSalir(function(){
    change_drag_buttons(false);
});

maquina.en(2).ejecutar().alEntrar(function(){
    change_drag_buttons(true);
});
maquina.en(2).ejecutar().alSalir(function(){
    change_drag_buttons(false);
});


function change_normal_buttons(value){
    document.getElementById("btn_delete_nodes").disabled = value;
    document.getElementById("mask").disabled = value;
    //document.getElementById("btn_delete_mask").disabled = value;
    //document.getElementById("btn_delete_all").disabled = value;
    document.getElementById("btn_cancel").disabled = value;
}
function change_drag_buttons(value){
    document.getElementById("mask").disabled = value;
    document.getElementById("btn_drag").disabled = value;
    document.getElementById("btn_mask").disabled = value;
    document.getElementById("btn_cancel").disabled = value;
    document.getElementById("btn_delete_nodes").disabled = value;
    document.getElementById("btn_delete_mask").disabled = value;
    document.getElementById("btn_delete_all").disabled = value;
}
function change_edit_buttons(value){
    //document.getElementById("mask").disabled = value;
    document.getElementById("btn_edit").disabled = value;
    document.getElementById("btn_mask").disabled = value;
    document.getElementById("btn_cancel").disabled = value;
}

function change_add_mask_buttons(value){
    //document.getElementById("btn_cancel").disabled = value;
    document.getElementById("btn_normal").disabled = value;
    document.getElementById("btn_drag").disabled = value;
    document.getElementById("btn_edit").disabled = value;
    document.getElementById("btn_mask").disabled = value;
    document.getElementById("btn_redo").disabled = value;
    document.getElementById("btn_delete_nodes").disabled = value;
    document.getElementById("btn_delete_mask").disabled = value;
    document.getElementById("btn_delete_all").disabled = value; 
}
maquina.en(3).ejecutar().alEntrar(function(){
    change_edit_buttons(true);
});
maquina.en(3).ejecutar().alSalir(function(){
    change_edit_buttons(false);
});
maquina.en(5).ejecutar().alEntrar(function(){
    change_edit_buttons(true);
});
maquina.en(5).ejecutar().alSalir(function(){
    change_edit_buttons(false);
});
maquina.en(7).ejecutar().alEntrar(function(){
    change_add_mask_buttons(true)
});
maquina.en(7).ejecutar().alSalir(function(){
    change_add_mask_buttons(false)
});
maquina.en(8).ejecutar().alEntrar(function(){
    change_add_mask_buttons(true)
});
maquina.en(8).ejecutar().alSalir(function(){
    change_add_mask_buttons(false)
});


maquina.en(0).ejecutar().alEntrar(function(){
    change_normal_buttons(true);
});
maquina.en(100).ejecutar().alSalir(function(){
    document.getElementById("btn_export").disabled = false;
    document.getElementById("btn_import").disabled = false;
    document.getElementById("btn_normal").disabled = false;
    document.getElementById("btn_drag").disabled = false;
    document.getElementById("btn_edit").disabled = false;
    document.getElementById("mask").disabled = false;
    document.getElementById("btn_mask").disabled = false;
    document.getElementById("btn_cancel").disabled = false;
    document.getElementById("btn_undo").disabled = false;
    document.getElementById("btn_redo").disabled = false;
    document.getElementById("btn_delete_nodes").disabled = false;
    document.getElementById("btn_delete_mask").disabled = false;
    document.getElementById("btn_delete_all").disabled = false;

});
 maquina.en(7).cuando("cancel").ejecutar(function(){
    count_shapes -=1
    delete shapes[""+(count_shapes)+""];
    shape = null;
    update(ctx,canvas,shapes);
}).irA(0);


maquina.inicio(100);

function change_mask(){
    maquina.lanzar("changed_mask");
}

function onMouseUp(){
    maquina.lanzar("mouse_up");
}
function onMouseDown(){
    maquina.lanzar("mouse_down");
}
function onMouseMove(){
    maquina.lanzar("mouse_move");
}

function drag_mode(){
    maquina.lanzar("drag_mode");
}
function normal_mode(){
    maquina.lanzar("normal_mode");
}
function edit_mode(){
    maquina.lanzar("edit_mode");
}

function add_mask(){
    maquina.lanzar("add_mask");
}

function undo_history(history_undo,history_redo){
    if(history_undo.length > 0){
        var previous_state = history_undo.pop();
        history_redo.push(shapes);
        shapes = previous_state;
    }
}

function redo_history(history_undo,history_redo){
    if(history_redo.length>0){
        history_undo.push(shapes);
        shapes = history_redo.pop();
        //update(ctx,canvas,shapes);
    }
}

///js buttons


document.onkeypress = function (e) {
    e = e || window.event;
    if(e.key == "z" && e.ctrlKey){
        undo();
    }
    if((e.key == "Z" && e.ctrlKey && e.shiftKey) || (e.key == "y" && e.ctrlKey)) {
        redo();
    }
    console.log(e)
};

function undo(){
    maquina.lanzar("undo");
}

function redo(){
    maquina.lanzar("redo");
}
function delete_selected_shape(){
    update_history(shapes,history_undo,history_redo);
    delete shapes[SelectedShape];
    update(ctx,canvas,shapes);
}

function delete_selected_nodes(){
    update_history(shapes,history_undo,history_redo);
    for(var j = 0 ; j < SelectedNodes.length; j++){
        for(var i = 0; i < shapes[ShapeOfSelectedNode].path.length ; i++){
            if(shapes[ShapeOfSelectedNode].path[i].x == SelectedNodes[j].x && shapes[ShapeOfSelectedNode].path[i].y == SelectedNodes[j].y){
                shapes[ShapeOfSelectedNode].path.splice(i, 1);
            }
        }
    }
    SelectedNodes = new Array();
    update(ctx,canvas,shapes);
}

function remove_all(){
    update_history(shapes,history_undo,history_redo);
    shapes = {};
    update(ctx,canvas,shapes);
}

function cancel_polygon(){
   maquina.lanzar("cancel");
}

function import_json(){
    document.getElementById('import').click();
    console.log("import")
}

var reader = new FileReader();

reader.onload = function(){
  var text = reader.result;
  shapes = JSON.parse(text);
  shape = shapes[0]
  update(ctx,canvas,shapes);
};

document.getElementById('import').onchange = function(event) {
    var input = event.target;
    reader.readAsText(input.files[0]);
}

function export_json(){
    var text = JSON.stringify(shapes);
    download(fileobj.name+".json",text);
}

function download(filename, text) {
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);
  pom.style.display = 'none';
  document.body.appendChild(pom);
  pom.click();
  document.body.removeChild(pom);
}