var ctx;
var rect;
var canvas_elem;
var array_of_points = [];
var dcp = false;

// The point DS
function Point(x, y)
{
  this.x = x;
  this.y = y;
}

Point.prototype.toString = function() 
{
	return '{'+x+','+y+'}';
};

//The Matrix Datastructure
function Matrix(ary)
{
    this.mtx = ary
    this.height = ary.length;
    this.width = ary[0].length;
}
 
Matrix.prototype.toString = function() 
{
    var s = []
    for (var i = 0; i < this.mtx.length; i++) 
        s.push( this.mtx[i].join(",") );
    return s.join("\n");
}

Matrix.prototype.mult = function(other) 
{
    if (this.width != other.height) 
    {
    	console.log("Incompatible Matrix Size");
    } 
    var result = [];
    for (var i = 0; i < this.height; i++) {
        result[i] = [];
        for (var j = 0; j < other.width; j++) {
            var sum = 0;
            for (var k = 0; k < this.width; k++) {
                sum += this.mtx[i][k] * other.mtx[k][j];
            }
            result[i][j] = sum;
        }
    }
    return new Matrix(result); 
}


var bs_mult = new Matrix([[0.1667,0.6667,0.1667,0.0],[0.0853,0.6307,0.2827,0.0013],[0.0360,0.5387,0.4147,0.0107],[0.0107,0.4147,0.5387,0.0360],[0.0013,0.2827,0.6307,0.0853]]);

//The triangle DS
function Triangle(a,b,c)
{
	this.a = a;
	this.b = b;
	this.c = c;
}

Triangle.prototype.toString = function()
{
	return '['+a+','+b+','+c+']';
}

//The Circumcircle DS
function TriangleMoreInfo(cx,cy,crad)
{
	this.cx = cx;
	this.cy = cy;
	this.crad = crad;
}

//The EDGE DS
function Edge(p1,p2)
{
	this.p1 = p1;
	this.p2 = p2;
}

function init()
{
	canvas_elem = $('#canvas');
	ctx = $('#canvas')[0].getContext("2d");
	rect = $('#canvas')[0].getBoundingClientRect();
	$("#nospoints span").html(array_of_points.length);
}

function draw_dot(x,y)
{
	ctx.fillRect(x-1,y-1,5,5);
}

function sign(p1,p2,p3)
{
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

function inside_triangle(pt,v1,v2,v3)
{
  var b1, b2, b3;

  b1 = (sign(pt, v1, v2) < 0.0);
  b2 = (sign(pt, v2, v3) < 0.0);
  b3 = (sign(pt, v3, v1) < 0.0);

  return ((b1 == b2) && (b2 == b3));
}

function draw_control_polygon()
{
	var nos_control_point = array_of_points.length;
	//Draw the control polygon
	for(var j=0;j<nos_control_point;j++)
	{
		draw_dot(array_of_points[j].x,array_of_points[j].y);
	}
	for(var i=1;i<nos_control_point;i++)
	{
		ctx.beginPath();
		ctx.strokeStyle = '#ff0000';
		ctx.moveTo(array_of_points[i-1].x,array_of_points[i-1].y);
		ctx.lineTo(array_of_points[i].x,array_of_points[i].y);
		ctx.stroke();
	}
}

//Associative Arrays data-structure
function AssociativeArray() {
  this.length = 0;
}

AssociativeArray.prototype.set = function(key, value) {
  key = key.key1+'|'+key.key2;
  if(!this[key]) {
    this.length++;
  }
  this[key] = value;
};

AssociativeArray.prototype.get = function(key) {
  return this[key.key1+'|'+key.key2];
};

AssociativeArray.prototype.toString = function() {
  var k, key, arr = [];
  for(k in this) {
    if(this.hasOwnProperty(k) && k !== 'length') {
      key = k.split('|');
      arr.push(['{key1:', key[0], ', key2:', key[1], '} => [', this[k].toString(), ']'].join(''));
    }
  }
  return '[' + arr.join(', ') + ']';
};

AssociativeArray.prototype.keys = function() {
  var k, key, arr = [];
  for(k in this) {
    if(this.hasOwnProperty(k) && k !== 'length') {
      key = k.split('|');
      arr.push({
        key1: key[0],
        key2: key[1]
      });
    }
  }
  return arr;
};


function inside_circumcircle(xt,yt,ax,ay,bx,by,cx,cy)
{
	if(ay==by && by==cy && ay==cy)
		return [false,0,0,0];

	var d = 2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by));

	var uxx =  (ax*ax+ay*ay)*(by-cy) + (bx*bx+by*by)*(cy-ay) + (cx*cx+cy*cy)*(ay-by) ;
	var uyy =  (ax*ax+ay*ay)*(cx-bx) + (bx*bx+by*by)*(ax-cx) + (cx*cx+cy*cy)*(bx-ax) ;

	var xc = Math.floor(uxx/d);
	var yc = Math.floor(uyy/d);

	var dx = bx - xc;
	var dy = by - yc;

	// document.write(cx);
	// document.write("--");
	// document.write(cy);

	var rsqr = dx*dx + dy*dy;

	dx = xt - xc;
	dy = yt - yc;

	var drsqr = dx*dx + dy*dy;

	if(drsqr<rsqr)
		return [true,xc,yc,rsqr];
	else
		return [false,xc,yc,rsqr];

}

function delaunay_button_event_handler(evt)
{
	ctx.clearRect(0,0,400,300);
	//All the triangle related DS
	var num_tri = 0;
	var array_of_triangles = [];
	var completed = [];
	var edge = [];
	if(array_of_points.length<3)
		return;
	//var minx=400,miny=400,maxx=0,maxy=0;
	var minx=array_of_points[0].x;
	var maxx=array_of_points[0].x;
	var miny=array_of_points[0].y;
	var maxy=array_of_points[0].y;
	//1st find the bounds for the point set 
	for(var i=1;i<array_of_points.length;i++)
	{
		if(array_of_points[i].x>maxx)
			maxx = array_of_points[i].x;
		if(array_of_points[i].y>maxy)
			maxy = array_of_points[i].y;
		if(array_of_points[i].x<minx)
			minx = array_of_points[i].x;
		if(array_of_points[i].y<miny)
			miny = array_of_points[i].y;
	}

	//Backup the original number of vertices
	var org_nos_vertices = array_of_points.length;

	var dx = maxx-minx;
	var dy = maxy-miny;
	var dmax;
	if(dx>dy)
		dmax = 3*dx;
	else
		dmax = 3*dy;

	var xmid = Math.round((maxx+minx)*0.5);//make these 3 times
	var ymid = Math.round((maxy+miny)*0.5);

	var suptri1 = new Point(xmid-Math.round(0.866*dmax),ymid+Math.round(0.5*dmax));
	var suptri2 = new Point(xmid+Math.round(0.866*dmax),ymid+Math.round(0.5*dmax));
	var suptri3 = new Point(xmid,ymid-dmax); 

	//Push them to the array 
	array_of_points.push(suptri1);
	array_of_points.push(suptri2);
	array_of_points.push(suptri3);

	//Add the triangle to the list of triangles 
	var super_triangle = new Triangle(org_nos_vertices,org_nos_vertices+1,org_nos_vertices+2);
	array_of_triangles.push(super_triangle);

	num_tri = 1;
	completed[0] = false;
	//Now we start the main loop
	for(var i=0;i<org_nos_vertices;i++)
	{
		var x_cur = array_of_points[i].x;
		var y_cur = array_of_points[i].y;
		var nos_edge = 0;

		for(var j=0;j<num_tri;j++)
		{
			if(completed[j])
				continue;
			var ax = array_of_points[array_of_triangles[j].a].x;
			var ay = array_of_points[array_of_triangles[j].a].y;
			var bx = array_of_points[array_of_triangles[j].b].x;
			var by = array_of_points[array_of_triangles[j].b].y;
			var cx = array_of_points[array_of_triangles[j].c].x;
			var cy = array_of_points[array_of_triangles[j].c].y;

			var result = inside_circumcircle(x_cur,y_cur,ax,ay,bx,by,cx,cy);
			
			var inside = result[0];
			var xc = result[1];
			var yc = result[2];
			var radsq = result[3];

			if(inside)
			{
				edge[nos_edge] = new Edge(array_of_triangles[j].a,array_of_triangles[j].b);
				edge[nos_edge+1] = new Edge(array_of_triangles[j].b,array_of_triangles[j].c);				
				edge[nos_edge+2] = new Edge(array_of_triangles[j].c,array_of_triangles[j].a);
				nos_edge +=3;
				array_of_triangles[j]=array_of_triangles[num_tri-1];
				completed[j]= completed[num_tri-1];
				num_tri--;
				j--;

			}
		}

		for(var j=0;j<nos_edge-1;j++)
		{
			for(var k=j+1;k<nos_edge;k++)
			{
				
				if((edge[j].p1==edge[k].p2)&&(edge[j].p2==edge[k].p1))
				{
					edge[j] = new Edge(-1,-1);
					edge[k] = new Edge(-1,-1);
				}
				//Maybe delete later
				if((edge[j].p1==edge[k].p1)&&(edge[j].p2==edge[k].p2))
				{
					edge[j] = new Edge(-1,-1);
					edge[k] = new Edge(-1,-1);
				}
			}
		}

		for(var j=0;j<nos_edge;j++)
		{
			if(edge[j].p1<0 || edge[j].p2<0)
				continue;
			//May have to add somekinf od escape hatch
			array_of_triangles[num_tri] = new Triangle(edge[j].p1,edge[j].p2,i);
			completed[num_tri] = false;
			num_tri++;
		}
	}

	console.log('before nos tri:'+num_tri);
	
	
	for(var i=0;i<num_tri;i++)
	{
		console.log(array_of_triangles[i]);
		if(array_of_triangles[i].a >= org_nos_vertices || array_of_triangles[i].b >= org_nos_vertices || array_of_triangles[i].c >= org_nos_vertices)
		{
			array_of_triangles[i] = array_of_triangles[num_tri-1];
			num_tri--;
			i--;
		}
	}
		
	
	
	//Now render the triangles
	console.log('nos tri:'+num_tri);
	for(var i=0;i<num_tri;i++)
	{
		draw_dot(array_of_points[array_of_triangles[i].a].x,array_of_points[array_of_triangles[i].a].y);
		draw_dot(array_of_points[array_of_triangles[i].b].x,array_of_points[array_of_triangles[i].b].y);
		draw_dot(array_of_points[array_of_triangles[i].c].x,array_of_points[array_of_triangles[i].c].y);
		ctx.beginPath();
		ctx.moveTo(array_of_points[array_of_triangles[i].a].x,array_of_points[array_of_triangles[i].a].y);
		ctx.lineTo(array_of_points[array_of_triangles[i].b].x,array_of_points[array_of_triangles[i].b].y);
		ctx.lineTo(array_of_points[array_of_triangles[i].c].x,array_of_points[array_of_triangles[i].c].y);
		ctx.lineTo(array_of_points[array_of_triangles[i].a].x,array_of_points[array_of_triangles[i].a].y);
		ctx.stroke();
	}
	
	//Restore them to their original glory 
	array_of_points.length = org_nos_vertices;		
}

function voronoi_button_event_handler(evt)
{
	//All the triangle related DS
	var num_tri = 0;
	var array_of_triangles = [];
	var array_of_circumcircles = [];
	var completed = [];
	var edge = [];
	if(array_of_points.length<3)
		return;
	var minx=400,miny=400,maxx=0,maxy=0;
	//1st find the bounds for the point set 
	for(var i=0;i<array_of_points.length;i++)
	{
		if(array_of_points[i].x>maxx)
			maxx = array_of_points[i].x;
		if(array_of_points[i].y>maxy)
			maxy = array_of_points[i].y;
		if(array_of_points[i].x<miny)
			miny = array_of_points[i].x;
		if(array_of_points[i].y<miny)
			miny = array_of_points[i].y;
	}
	//Next calculate the values that we need to compute the super triangle
	var dx = maxx-minx;
	var dy = maxy-miny;
	var dmax = Math.max(dx,dy);
	var xmid = Math.round((maxx+minx)*0.5);
	var ymid = Math.round((maxy+miny)*0.5);
	//Now we see if we can get the supertriangle vertices 
	//Add them to the list of vertices 
	var org_nos_vertices = array_of_points.length;

	array_of_points.push(new Point(xmid-20*dmax,ymid-dmax));
	array_of_points.push(new Point(xmid,ymid+20*dmax));
	array_of_points.push(new Point(xmid+20*dmax,ymid-dmax));
	//Add the triangle to the list of triangles 
	array_of_triangles.push(new Triangle(org_nos_vertices,org_nos_vertices+1,org_nos_vertices+2));

	var temp_res = inside_circumcircle(1,1,array_of_points[org_nos_vertices].x,array_of_points[org_nos_vertices].y,array_of_points[org_nos_vertices+1].x,array_of_points[org_nos_vertices+1].y,array_of_points[org_nos_vertices+2].x,array_of_points[org_nos_vertices+2].y);
	array_of_circumcircles[0] = new TriangleMoreInfo(temp_res[1],temp_res[2],Math.round(Math.sqrt(temp_res[3])));

	num_tri = 1;
	completed[0] = false;
	//Now we start the main loop
	for(var i=0;i<org_nos_vertices;i++)
	{
		var x_cur = array_of_points[i].x;
		var y_cur = array_of_points[i].y;
		var nos_edge = 0;

		for(var j=0;j<num_tri;j++)
		{
			if(completed[j])
				continue;
			var ax = array_of_points[array_of_triangles[j].a].x;
			var ay = array_of_points[array_of_triangles[j].a].y;
			var bx = array_of_points[array_of_triangles[j].b].x;
			var by = array_of_points[array_of_triangles[j].b].y;
			var cx = array_of_points[array_of_triangles[j].c].x;
			var cy = array_of_points[array_of_triangles[j].c].y;

			var result = inside_circumcircle(x_cur,y_cur,ax,ay,bx,by,cx,cy);
			
			var inside = result[0];
			var xc = result[1];
			var yc = result[2];
			var radsq = result[3];
			
			if(xc<x_cur && ((x_cur-xc)*(x_cur-xc))>radsq )
				completed[j] = true;

			if(inside)
			{
				edge[nos_edge] = new Edge(array_of_triangles[j].a,array_of_triangles[j].b);
				edge[nos_edge+1] = new Edge(array_of_triangles[j].b,array_of_triangles[j].c);				
				edge[nos_edge+2] = new Edge(array_of_triangles[j].c,array_of_triangles[j].a);
				nos_edge +=3;
				array_of_triangles[j]=array_of_triangles[num_tri-1];
				array_of_circumcircles[j]=array_of_circumcircles[num_tri-1];
				completed[j]= completed[num_tri-1];
				num_tri--;
				j--;

			}
		}

		for(var j=0;j<nos_edge-1;j++)
		{
			for(var k=j+1;k<nos_edge;k++)
			{
				if((edge[j].p1==edge[k].p2)&&(edge[j].p2==edge[k].p1))
				{
					edge[j] = new Edge(-1,-1);
					edge[k] = new Edge(-1,-1);
				}
				//Maybe delete later
				if((edge[j].p1==edge[k].p1)&&(edge[j].p2==edge[k].p2))
				{
					edge[j] = new Edge(-1,-1);
					edge[k] = new Edge(-1,-1);
				}

			}
		}

		for(var j=0;j<nos_edge;j++)
		{
			if(edge[j].p1<0 || edge[j].p2<0)
				continue;
			//May have to add somekinf od escape hatch
			array_of_triangles[num_tri] = new Triangle(edge[j].p1,edge[j].p2,i);
			completed[num_tri] = false;
			var temp_res = inside_circumcircle(1,1,array_of_points[edge[j].p1].x,array_of_points[edge[j].p1].y,array_of_points[edge[j].p2].x,array_of_points[edge[j].p2].y,array_of_points[i].x,array_of_points[i].y);
			array_of_circumcircles[num_tri] = new TriangleMoreInfo(temp_res[1],temp_res[2],Math.round(Math.sqrt(temp_res[3])));
			num_tri++;
		}

	}

	
	for(var i=0;i<num_tri;i++)
	{
		if(array_of_triangles[i].a >= org_nos_vertices || array_of_triangles[i].b >= org_nos_vertices || array_of_triangles[i].c >= org_nos_vertices)
		{
			array_of_triangles[i] = array_of_triangles[num_tri-1];
			array_of_circumcircles[i] = array_of_circumcircles[num_tri-1];
			num_tri--;
			i--;
		}
	}
	var asso_arr = new AssociativeArray();
	
	for(var i=0;i<num_tri;i++)
	{
		var idx = [];
		idx[0] = array_of_triangles[i].a;
		idx[1] = array_of_triangles[i].b; 
		idx[2] = array_of_triangles[i].c;
		//Lets arrange them in the order min,mid,max
		idx.sort();
		var res1 = asso_arr.get({key1:idx[0],key2:idx[1]});
		var res2 = asso_arr.get({key1:idx[1],key2:idx[2]});
		var res3 = asso_arr.get({key1:idx[0],key2:idx[2]});

		if(res1)
		{
			asso_arr.set({key1:idx[0],key2:idx[1]},[res1[0],i]);
		}
		else
		{
			asso_arr.set({key1:idx[0],key2:idx[1]},[i,-1]);
		}
		if(res2)
		{
			asso_arr.set({key1:idx[1],key2:idx[2]},[res2[0],i]);
		}
		else
		{
			asso_arr.set({key1:idx[1],key2:idx[2]},[i,-1]);
		}
		if(res3)
		{
			asso_arr.set({key1:idx[0],key2:idx[2]},[res3[0],i]);
		}
		else
		{
			asso_arr.set({key1:idx[0],key2:idx[2]},[i,-1]);
		}
	}
	//console.log(asso_arr.toString(),'lenght='+asso_arr.length);

	/*
	var set_of_edge_pairs = {};
	set_of_edge_pairs[{edge1:-1,edge2:-1}] = [-1,-1];
	//Lets put all the triangles in a nice DS
	for(var i=0;i<num_tri;i++)
	{
		var idx = [];
		idx[0] = array_of_triangles[i].a;
		idx[1] = array_of_triangles[i].b; 
		idx[2] = array_of_triangles[i].c;
		//Lets arrange them in the order min,mid,max
		idx.sort();
		//the three ones are (0,1) (1,2) (0,2)
		var res1 = set_of_edge_pairs[{edge1:idx[0],edge2:idx[1]}];
		var res2 = set_of_edge_pairs[{edge1:idx[1],edge2:idx[2]}];
		var res3 = set_of_edge_pairs[{edge1:idx[0],edge2:idx[2]}];
		var temp_store;
		if(res1)
		{
			set_of_edge_pairs[{edge1:idx[0],edge2:idx[1]}] = [res1[0],i];
		}
		else
		{
			set_of_edge_pairs[{edge1:idx[0],edge2:idx[1]}] = [i,-1];
		}
		if(res2)
		{
			set_of_edge_pairs[{edge1:idx[1],edge2:idx[2]}] = [res2[0],i];
		}
		else
		{
			set_of_edge_pairs[{edge1:idx[1],edge2:idx[2]}] = [i,-1];
		}
		if(res3)
		{
			set_of_edge_pairs[{edge1:idx[0],edge2:idx[2]}] = [res3[0],i];
		}
		else
		{
			set_of_edge_pairs[{edge1:idx[0],edge2:idx[2]}] = [i,-1];
		}
	}
	//Lets do an edge to edge rendering 
	*/
	var i,l,keys = asso_arr.keys();
	for(i=0, l=keys.length; i<l; i++)
	{
		var cur_key = keys[i];
		var cur_val = asso_arr.get(keys[i]);
		if(cur_val[0]!=-1 && cur_val[1]!=-1)
		{
			draw_dot(array_of_circumcircles[cur_val[0]].cx,array_of_circumcircles[cur_val[0]].cy);
			draw_dot(array_of_circumcircles[cur_val[1]].cx,array_of_circumcircles[cur_val[1]].cy);

			ctx.beginPath();
			ctx.moveTo(array_of_circumcircles[cur_val[0]].cx,array_of_circumcircles[cur_val[0]].cy);
			ctx.lineTo(array_of_circumcircles[cur_val[1]].cx,array_of_circumcircles[cur_val[1]].cy);
			ctx.stroke();

			//ctx.beginPath();
			//ctx.arc(array_of_circumcircles[cur_val[0]].cx,array_of_circumcircles[cur_val[0]].cy,array_of_circumcircles[cur_val[0]].crad,0,Math.PI*2);
			//ctx.stroke();

			//ctx.beginPath();
			//ctx.arc(array_of_circumcircles[cur_val[1]].cx,array_of_circumcircles[cur_val[1]].cy,array_of_circumcircles[cur_val[1]].crad,0,Math.PI*2);
			//ctx.stroke();
		}
		else
		{
			// ctx.beginPath();
			// ctx.arc(array_of_circumcircles[cur_val[0]].cx,array_of_circumcircles[cur_val[0]].cy,array_of_circumcircles[cur_val[0]].crad,0,Math.PI*2);
			// ctx.strokeStyle = '#003300';
			// ctx.stroke();
			
			//Get the starting circumcenter
			var cx_ = array_of_circumcircles[cur_val[0]].cx;
			var cy_ = array_of_circumcircles[cur_val[0]].cy;

			var t_res = inside_circumcircle(cx_,cy_,array_of_points[array_of_triangles[cur_val[0]].a].x,array_of_points[array_of_triangles[cur_val[0]].a].y,
				array_of_points[array_of_triangles[cur_val[0]].b].x,array_of_points[array_of_triangles[cur_val[0]].b].y,
				array_of_points[array_of_triangles[cur_val[0]].c].x,array_of_points[array_of_triangles[cur_val[0]].c].y);

			var cc_pnt = new Point(cx_,cy_);
			var inside = inside_triangle(cc_pnt,array_of_points[array_of_triangles[cur_val[0]].a],array_of_points[array_of_triangles[cur_val[0]].b],array_of_points[array_of_triangles[cur_val[0]].c]);

			//Get the perpendicular bisector  and all
			var ax_ = array_of_points[cur_key.key1].x;
			var ay_ = array_of_points[cur_key.key1].y;
			var bx_ = array_of_points[cur_key.key2].x;
			var by_ = array_of_points[cur_key.key2].y;
			var mx_ = Math.round((ax_+bx_)*0.5);
			var my_ = Math.round((ay_+by_)*0.5);
			var dx_ = mx_ - cx_;
			var dy_ = my_ - cy_;
			if(!inside)
			{
				dx_ = -dx_;
				dy_ = -dy_;
			}

			var taro = [];
			taro[0] = (0-cx_)/dx_;
			taro[1] = (400-cx_)/dx_;
			taro[2] = (0-cy_)/dy_;
			taro[3] = (300-cy_)/dy_;
			taro.sort();
			var t_interest = taro[2];
			// var tmin = (t0x > t0y)?t0x:t0y;

			//console.log('t0x:'+t0x,'t1x:'+t1x,'t0y:'+t0y,'t1y:'+t1y);

			var ix_ = Math.round(cx_+(t_interest*dx_));
			var iy_ = Math.round(cy_+(t_interest*dy_));

			draw_dot(cx_,cy_);
			draw_dot(ix_,iy_);

			ctx.beginPath();
			ctx.moveTo(cx_,cy_);
			ctx.lineTo(ix_,iy_);
			ctx.stroke();


		}
  			//console.log(cur_key.key1,cur_key.key2,cur_val[0],cur_val[1]);
	}

	/*
	//Now render the triangles
	for(var i=0;i<num_tri;i++)
	{
		ctx.beginPath();
		ctx.moveTo(array_of_points[array_of_triangles[i].a].x,array_of_points[array_of_triangles[i].a].y);
		ctx.lineTo(array_of_points[array_of_triangles[i].b].x,array_of_points[array_of_triangles[i].b].y);
		ctx.lineTo(array_of_points[array_of_triangles[i].c].x,array_of_points[array_of_triangles[i].c].y);
		ctx.lineTo(array_of_points[array_of_triangles[i].a].x,array_of_points[array_of_triangles[i].a].y);
		ctx.stroke();
	}
	*/
	//Restore them to their original glory 
	array_of_points.length = org_nos_vertices;	
}


function reset_button_event_handler(evt)
{
	array_of_points.length = 0;
	ctx.clearRect(0,0,400,300);
}

function mouse_click_event_handler(evt)
{
	var xc,yc;
	xc = Math.round(evt.pageX - canvas_elem.offset().left);
	yc = Math.round(evt.pageY - canvas_elem.offset().top);
	if(xc>=0 && xc<400 && yc>=0 && yc<300)
	{
		var temp_pnt = new Point(xc,yc);
		array_of_points.push(temp_pnt);
		console.log(temp_pnt);
  		draw_dot(xc,yc);
	}
  	$("#nospoints span").html(array_of_points.length);
}

function decasteljau(control_points,u)
{
	var n = control_points.length;
	if(n==1)
	{
		// console.log(control_points[0]);
		return control_points[0];
	}
	else	
	{
		var new_cp =[];
		for(var i=0;i<n-1;i++)
		{
			var x_c_i = Math.floor(control_points[i].x+u*(control_points[i+1].x-control_points[i].x));
			var y_c_i = Math.floor(control_points[i].y+u*(control_points[i+1].y-control_points[i].y));
			new_cp.push(new Point(x_c_i,y_c_i));
		}
		return decasteljau(new_cp,u);
	}
}

function bspline_curve_event_handler()
{

	var nos_points_bsp = 0;
	var n = array_of_points.length;
	if(n<4)
	{
		alert("Too few points for Cubic B-Spline.\nMin Points required :4");
		return;
	}
	var array_o_cbs = [];
	for(var i=1;i<=n-3;i++)
	{
		var point_mat = new Matrix([[array_of_points[i-1].x,array_of_points[i-1].y],[array_of_points[i].x,array_of_points[i].y],
			[array_of_points[i+1].x,array_of_points[i+1].y],[array_of_points[i+2].x,array_of_points[i+2].y]]);
		var result = bs_mult.mult(point_mat);
		console.log(result);
		for(var j=0;j<5;j++)
		{
			var temp = new Point(Math.floor(result.mtx[j][0]),Math.floor(result.mtx[j][1]));
			array_o_cbs.push(temp);
		}
	}
	nos_points_bsp = array_o_cbs.length;
	//Draw the curve
	ctx.clearRect(0,0,400,300);
	for(var i=1;i<nos_points_bsp;i++)
	{
		ctx.beginPath();
		ctx.strokeStyle = '#000000';
		ctx.moveTo(array_o_cbs[i-1].x,array_o_cbs[i-1].y);
		ctx.lineTo(array_o_cbs[i].x,array_o_cbs[i].y);
		ctx.stroke();
	}
	if(dcp)
	{
		draw_control_polygon();
	}
}


function bezier_curve_event_handler()
{
	var nos_control_point = array_of_points.length;
	var nos_points_bc = 0;
	var array_o_beziers = [];
	if(nos_control_point==1)
	{
		num_points_bc = 0;
	}
	else if(nos_control_point==2)
	{
		array_o_beziers[0] = array_of_points[0];
		array_o_beziers[1] = array_of_points[1];
		num_points_bc = 2;
	}
	else
	{
		var num_subdivisons = 20;
		array_o_beziers[0] = array_of_points[0];
		array_o_beziers[num_subdivisons] = array_of_points[nos_control_point-1];
		var gap = 1.0/num_subdivisons;
		var u = 0.0 + gap;
		for(var k=1;k<num_subdivisons;k++)
		{
			array_o_beziers[k] = decasteljau(array_of_points,u);
			u = u+gap;
		}
		nos_points_bc = num_subdivisons+1;
	}
	ctx.clearRect(0,0,400,300);
	console.log(nos_control_point);
	//Draw the curve
	for(var i=1;i<nos_points_bc;i++)
	{
		ctx.beginPath();
		ctx.strokeStyle = '#000000';
		ctx.moveTo(array_o_beziers[i-1].x,array_o_beziers[i-1].y);
		ctx.lineTo(array_o_beziers[i].x,array_o_beziers[i].y);
		ctx.stroke();
	}
	if(dcp)
	{
		draw_control_polygon();
	}
}

$(document).click(mouse_click_event_handler);
$('#reset_button').click(reset_button_event_handler);
$('#del_button').click(delaunay_button_event_handler);
$('#vor_button').click(voronoi_button_event_handler);
$('#bez_button').click(bezier_curve_event_handler);
$('#bsp_button').click(bspline_curve_event_handler);

$('#icpgen_true').click(function()
{
	if(this.checked)
		dcp = true;
	else
		dcp = false;
});


init();

