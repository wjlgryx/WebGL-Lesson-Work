(function( global, doc ){

  //////////////////////////////////////////////////////////////////////////////
  // Global Definitions ////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // Define script globals
  var gl,
      mvMatrix,
      pMatrix,
      shaderProgram,
      triangleVertexPositionBuffer,
      triangleVertexColorBuffer,
      squareVertexPositionBuffer,
      squareVertexColorBufferm,
      rTri          = 0,
      rSquare       = 0,
      lastTime      = 0,
      mvMatrixStack  = []
  ;

  function animate() {
    var timeNow = + new Date(),
        elapsed;
        
    if( lastTime != 0 ){
      elapsed  = timeNow - lastTime;
      rTri    += (90 * elapsed) / 1000;
      rSquare += (75 * elapsed) / 1000;
    }
    
    lastTime = timeNow;
  };

  function tick(){
    drawScene();
    animate();
  };

  function tick() {
    drawScene();
    animate();
  }

  function mvPushMatrix( m ){
    if( m ){
      mvMatrixStack.push( m.dup() );
      mvMatrix = m.dup();
    }else{
      mvMatrixStack.push( mvMatrix.dup() );
    }
  };

  function mvPopMatrix() {
    if( mvMatrixStack.length == 0 ){
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
  }; 
  function loadIdentity(){
    mvMatrix = Matrix.I( 4 );
  };
 
  function mvRotate( ang, v ){
    var arad = ang * Math.PI / 180;
    var m = Matrix.Rotation( arad, $V([ v[0], v[1], v[2] ]) ).ensure4x4();
    multMatrix( m );
  };
 
  function multMatrix( m ){
     mvMatrix = mvMatrix.x( m );
  };
 
  function mvTranslate( v ){
    var m = Matrix.Translation( $V([ v[0], v[1], v[2] ]) ).ensure4x4();
    multMatrix( m );
  }; 

  function perspective( fovy, aspect, znear, zfar ){
    pMatrix = makePerspective( fovy, aspect, znear, zfar );
  };

  function setMatrixUniforms(){
    gl.uniformMatrix4fv( shaderProgram.pMatrixUniform, false, new Float32Array( pMatrix.flatten() ) );
    gl.uniformMatrix4fv( shaderProgram.mvMatrixUniform, false, new Float32Array( mvMatrix.flatten() ) );
  }


  //////////////////////////////////////////////////////////////////////////////
  // getShader /////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function getShader( gl, id ){

    var shaderScript = document.getElementById( id ),
        str = "",
        k = shaderScript.firstChild,
        shader
    ;
        
    if( !shaderScript ){
      console.log( 'Shader script not found.' );
      return null;
    }

    while( k ){
      if( k.nodeType == 3 ){
        str += k.textContent;
        k = k.nextSibling;
      }
    }    

    if( shaderScript.type == 'x-shader/x-fragment' ){
      shader = gl.createShader( gl.FRAGMENT_SHADER );
    }else if( shaderScript.type == 'x-shader/x-vertex' ){
      shader = gl.createShader( gl.VERTEX_SHADER );
    }else{
      return null;
    }

    gl.shaderSource( shader, str );
    gl.compileShader( shader );

    if( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ){
      alert( gl.getShaderInfoLog( shader ) );
      return null;
    }

    return shader;
    
  };


  //////////////////////////////////////////////////////////////////////////////
  // initShaders ///////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function initShaders(){

    var fragmentShader = getShader( gl, "shader-fs" ),
        vertexShader = getShader( gl, "shader-vs" );

    shaderProgram = gl.createProgram();
    gl.attachShader( shaderProgram, vertexShader );
    gl.attachShader( shaderProgram, fragmentShader );
    gl.linkProgram( shaderProgram );

    if( !gl.getProgramParameter(shaderProgram, gl.LINK_STATUS ) ){
      alert( "Could not initialise shaders." );
    }

    gl.useProgram( shaderProgram );

    //Attach vertex shader program
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation( shaderProgram, "aVertexPosition" );
    gl.enableVertexAttribArray( shaderProgram.vertexPositionAttribute );

    // Link color values
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    // Link uniform values
    shaderProgram.pMatrixUniform = gl.getUniformLocation( shaderProgram, "uPMatrix" );
    shaderProgram.mvMatrixUniform = gl.getUniformLocation( shaderProgram, "uMVMatrix" );
        
  };
  
  
  //////////////////////////////////////////////////////////////////////////////
  // initGL ////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  
  function initGL( canvas ){
    try{
    
      gl = canvas.getContext( "experimental-webgl" );
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
      
    }catch( e ){
    
      if( console && console.log ){
        console.log( e );
      }
      
    }

    if( !gl ){
      alert( "Could not initialise WebGL." );
    }

  };


  //////////////////////////////////////////////////////////////////////////////
  // webGLStart ///////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // Initializes the WebGL Context and sets the drawScene Interval
  function webGLStart() {
    
    var canvas = document.getElementById( "lesson03-canvas" );
    
    initGL( canvas );
    initShaders();
    initBuffers();
    
    gl.clearColor( 0, 0, 0, 1 );
    gl.clearDepth( 1 );
    
    gl.enable( gl.DEPTH_TEST )
    gl.depthFunc( gl.LEQUAL );

    setInterval( tick, 15 );

  };


  //////////////////////////////////////////////////////////////////////////////
  // initBuffers ///////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // Initialize WebGL Buffers
  function initBuffers() {
  
    // TRIANGLE //////////////////////////////////////////////////////////////

    // Create a triangle vertex buffer on the graphics card
    triangleVertexPositionBuffer = gl.createBuffer();
    
    // Set the current buffer for operation
    gl.bindBuffer( gl.ARRAY_BUFFER, triangleVertexPositionBuffer );  

    // Define an array-list of vertices (in this case an Isosceles Triangle)
    var vertices = [
         0.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    
    // Create a Float32Array object to store the vertices from the array-list
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );
    
    // Set helper properties on the vertex-buffer, for later use
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;    
    

    // SQUARE ////////////////////////////////////////////////////////////////

    // Create a square vertex buffer on the graphics card
    squareVertexPositionBuffer = gl.createBuffer();

    // Set the current buffer for operation    
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    // Set the current buffer for operation

    // Create a Float32Array object to store the vertices from the array-list
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    
    // Create a Float32Array object to store the vertices from the array-list
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );
    
    // Set helper properties on the vertex-buffer, for later use
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;     


    // ...do the same for the triangle colors
    triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = 3;
    
    // ...do the same for the square colors
    squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    colors = []
    for( var i=0; i < 4; i++ ){
      colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;    
  };


  //////////////////////////////////////////////////////////////////////////////
  // drawScene /////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function drawScene(){
  
    // Set the viewport size for the WebGL Context
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );

    // Clear the WebGL Canvas in perparation for drawing
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // Set the persepective we want to apply to the scene (default settings would draw an Orthographic scene)
    perspective( 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0 );
  
    // Load the Identity (model-view) matrix
    loadIdentity();


    // TRIANGLE //////////////////////////////////////////////////////////////
         
    // Multiply the model-view matrix by a translation matrix
    mvTranslate([-1.5, 0.0, -7.0]);

    mvPushMatrix();
      
      mvRotate(rTri, [0, 1, 0]);

      // Specify the current buffer (load the triangle buffer for operation)
      gl.bindBuffer( gl.ARRAY_BUFFER, triangleVertexPositionBuffer );
      
      // Tell WebGL to read vertex positions from the triangle buffer
      gl.vertexAttribPointer( shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0 );

      // Tell WebGL to read color data from the triangle color buffer
      gl.bindBuffer( gl.ARRAY_BUFFER, triangleVertexColorBuffer );
      gl.vertexAttribPointer( shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0 );

      // Apply model-view matrix on graphics card
      setMatrixUniforms();

      // Draw the array of vertices given earlier for the triangle shape, starting at the 0th item and ending on numItems
      gl.drawArrays( gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems );

    mvPopMatrix();

    // SQUARE //////////////////////////////////////////////////////////////

    // Multiply the model-view matrix by a translation matrix
    mvTranslate([ 3.0, 0.0, 0.0 ])

    mvPushMatrix();
    
      mvRotate( rSquare, [1, 0, 0] );
      
      // Specify the current buffer (load the square buffer for operation)
      gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexPositionBuffer );

      // Tell WebGL to read vertex positions from the triangle buffer
      gl.vertexAttribPointer( shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0 );

      // Tell WebGL to read color data from the triangle color buffer
      gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexColorBuffer );
      gl.vertexAttribPointer( shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0 );

      // Apply model-view matrix on graphics card
      setMatrixUniforms();
      
      // Draw the array of vertices given earlier for the square shape, starting at the 0th item and ending on numItems
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems );
    
    mvPopMatrix();
  
  };


  //////////////////////////////////////////////////////////////////////////////
  // DOMContentLoaded //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // Begins initialization when the DOM is ready
  doc.addEventListener( 'DOMContentLoaded', function(){ webGLStart(); }, false );
  
})( window, document );
