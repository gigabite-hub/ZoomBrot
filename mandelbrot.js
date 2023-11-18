// Vertex Shader
const vertexShaderSource = `
attribute vec4 a_position;
void main() {
    gl_Position = a_position;
}
`;

// Fragment Shader
const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_boundaries;

vec3 getColor(float t) {
    // Map t to a color gradient (you can customize this gradient)
    return vec3(1.0 - t, t * 0.5, t);
}

int mandelbrot(vec2 c) {
    const int maxIterations = 100;
    vec2 z = c;
    for (int i = 0; i < maxIterations; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (length(z) > 4.0) {
            return i;
        }
    }
    return maxIterations;
}

void main() {
    // Normalize coordinates to the Mandelbrot set boundaries
    vec2 normalizedCoords = (gl_FragCoord.xy / u_resolution) * (u_boundaries.y - u_boundaries.x) + vec2(u_boundaries.x, u_boundaries.x);

    // Map the normalized coordinates to the complex plane
    vec2 c = vec2(normalizedCoords.x, normalizedCoords.y);

    // Calculate Mandelbrot set color
    int iterations = mandelbrot(c);
    float t = float(iterations) / float(100); // Normalize to [0, 1]

    // Get color from the gradient
    vec3 color = getColor(t);

    // Output the calculated color
    gl_FragColor = vec4(color, 1.0);
}
`;


// Initialize WebGL
const canvas = document.getElementById('mandelbrotCanvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
}

// Compile Shader
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

// Create Program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Create Buffers
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = new Float32Array([
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    1.0, 1.0,
]);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

// Set Position Attribute
const positionAttrib = gl.getAttribLocation(program, 'a_position');
gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttrib);

// Set Resolution Uniform
const resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
gl.uniform2f(resolutionUniform, canvas.width, canvas.height);

// Set Boundaries Uniform
const boundariesUniform = gl.getUniformLocation(program, 'u_boundaries');
const u_boundaries = [-2.0, 2.0];
gl.uniform2f(boundariesUniform, u_boundaries[0], u_boundaries[1]); // Use gl.uniform2f for a vec2


// Handle keyboard events for zooming
canvas.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 33: // PageUp key, Zoom in
            {
                let range = (u_boundaries[1] - u_boundaries[0]);
                let delta = (range - range * 0.9) * 0.5;
                u_boundaries[0] += delta;
                u_boundaries[1] -= delta;
            }
            console.log("Zoom In");
            break;

        case 34: // PageDown key, Zoom out
            {
                let range = (u_boundaries[1] - u_boundaries[0]);
                let delta = (range * 1.1 - range) * 0.5;
                u_boundaries[0] -= delta;
                u_boundaries[1] += delta;
            }
            console.log("Zoom Out");
            break;
    }

    // Update boundaries uniform with new boundaries
    gl.uniform2fv(boundariesUniform, u_boundaries);

    // Clear and Draw
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
});

// Ensure the canvas has focus
canvas.focus();

// Clear and Draw
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);