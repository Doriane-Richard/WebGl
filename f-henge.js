// Animer
'use strict';

import * as math from 'mathjs';
import { ndc, perspective, translation, yRotation, scaling, zRotation, xRotation } from '/matrices';
import { degToRad } from 'three/src/math/MathUtils.js';

//====================================
// Récupération canvas + WebGL
//====================================
const canvas = document.querySelector('canvas');

const gl = canvas.getContext('webgl2');
if (!gl) {
    throw new Error("No WebGL for you!")
};

//====================================
// Création et Association des shaders
//====================================
const vertex_GLSL = `#version 300 es
in vec3 a_position;
in vec3 a_color;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

out vec4 v_color;

void main() {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position,1);

  v_color = vec4(a_color,1);
}
`;

const fragment_GLSL = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
   outColor = v_color;
}
`;

const prg = creation_programme_shading(gl, [
    [gl.VERTEX_SHADER, vertex_GLSL],
    [gl.FRAGMENT_SHADER, fragment_GLSL]
]);

// Localisation des attributs
const positionLocation = gl.getAttribLocation(prg, "a_position");
const colorLocation = gl.getAttribLocation(prg, "a_color");
// Localisation des uniforms
const projectionMatrixLocation = gl.getUniformLocation(prg, "u_projectionMatrix");
const modelViewMatrixLocation = gl.getUniformLocation(prg, "u_modelViewMatrix");


gl.useProgram(prg);

const fieldOfViewInRadians = degToRad(60);
const zNear = 1;
const zFar = 1500;
const h = zNear * Math.tan(0.5 * fieldOfViewInRadians);
const w = h * canvas.clientWidth / canvas.clientHeight;

const cameraUP = degToRad(0);
let cameraMatrix = zRotation(cameraUP);
const radius = 130; 
const cameraAngleRadians = degToRad(-40);
let cameraMatrixInit = translation(0, 0, 600);
cameraMatrixInit = math.multiply(xRotation(cameraAngleRadians), cameraMatrixInit);

// Paramètres variants de l'animation : position de la caméra
let pos = -1;
let cameraPosRadians;

// Création des objets : couleurs, taille, forme...

var tourBaseColor = [153, 153, 150];
var tourGeometry = parseOBJ(tour);
let hauteurMaxTour = math.max(...tourGeometry);
var scalingFactorTour = 300/hauteurMaxTour;
var tourColors = getRandomColors(tourGeometry.length,tourBaseColor);

var casqueBaseColor = [232, 211, 23];
var casqueGeometry = parseOBJ(casque);
let hauteurMaxcasque = math.max(...tourGeometry);
var scalingFactorCasque= 5000/hauteurMaxcasque;
var casqueColors = getRandomColors(casqueGeometry.length,casqueBaseColor);

var chevalBaseColor = [135, 93, 9];
var chevalGeometry = parseOBJ(cheval);
var hauteurMaxCheval = math.max(...chevalGeometry);
var scalingFactorCheval = hauteurMaxCheval*0.001;
var chevalColors = getRandomColors(chevalGeometry.length,chevalBaseColor);

var bouclierBaseColor = [129, 227, 207];
var bouclierGeometry = parseOBJ(bouclier);
var hauteurMaxBouclier = math.max(...chevalGeometry);
var scalingFactorBouclier = hauteurMaxBouclier*0.002;
var bouclierColors = getRandomColors(bouclierGeometry.length,bouclierBaseColor);

var epeesBaseColor = [227, 226, 222];
var epeesGeometry = parseOBJ(epees);
var hauteurMaxEpees = math.max(...chevalGeometry);
var scalingFactorEpees = hauteurMaxEpees*0.006;
var epeesColors = getRandomColors(epeesGeometry.length,epeesBaseColor);

// Couleur fixe pour le terrain
var terrainColor = [];
for (let ii = 0; ii < getTerrainGeometry().length; ++ii) {
    terrainColor.push(47, 194, 57);
}

// Appel de la fonction principale pour dessiner la scène
drawScene();

// Fonction principale pour dessiner la scène
function drawScene() {
    // Réinitialiser le viewport
    // Le fragment shader dessine les pixels du viewport.
    // Le viewport définit normalement un sous-ensemble (et non un sur-ensemble) du canvas.
    // Le css vient ensuite déformer le canvas aux dimensions de la fenêtre.
    // Si pour la caméra, ce sont les dimensions de la fenêtre (cliente) qu'il faut récupérer
    // pour compenser la future déformation,
    // pour le viewport, ce sont les dimensions du canvas (avant déformation par le css).
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.7, 1.0, 1.0); // couleur du canvas et non du viewport
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    const h = zNear * Math.tan(0.5 * fieldOfViewInRadians);
    const w = h * canvas.clientWidth / canvas.clientHeight;

    const projectionMatrix = math.multiply(ndc(w, h, zNear, zFar), perspective(zNear, zFar));

    gl.uniformMatrix4fv(projectionMatrixLocation, false, math.flatten(math.transpose(projectionMatrix)).valueOf());

    pos = pos + 1;
    cameraPosRadians = degToRad(pos) / 3;
    cameraMatrix = math.multiply(yRotation(cameraPosRadians), cameraMatrixInit);

    const inversedCameraMatrixWorld = math.inv(cameraMatrix);

    const numFs = 5;

    const rotatingMatrix = math.multiply(inversedCameraMatrixWorld, yRotation(degToRad(pos)));
    for (let ii = 0; ii < numFs; ++ii) {
        drawEpees(rotatingMatrix, ii, numFs);
    }

    drawTour(inversedCameraMatrixWorld);
    drawCasque(inversedCameraMatrixWorld);
    drawCheval(inversedCameraMatrixWorld);
    drawBouclier(inversedCameraMatrixWorld);
    drawTerrain(inversedCameraMatrixWorld);


    requestAnimationFrame(drawScene);
}

// Fonctions de dessin pour chaque objet
function drawTour(cameraMatrix) {
    let modelViewMatrix = math.multiply(cameraMatrix, scaling(scalingFactorTour, scalingFactorTour, scalingFactorTour));
    drawObject(tourGeometry, tourColors, modelViewMatrix);
}

function drawCasque(cameraMatrix) {
    let modelViewMatrix = translation(215,-116,215);
    modelViewMatrix = math.multiply(modelViewMatrix, scaling(scalingFactorCasque, scalingFactorCasque, scalingFactorCasque));
    modelViewMatrix = math.multiply(modelViewMatrix, yRotation(degToRad(-120)));

    modelViewMatrix = math.multiply(cameraMatrix, modelViewMatrix);

    drawObject(casqueGeometry, casqueColors, modelViewMatrix);
}

function drawCheval(cameraMatrix) {
    let modelViewMatrix = translation(-200,0,225);
    modelViewMatrix = math.multiply(modelViewMatrix, scaling(scalingFactorCheval, scalingFactorCheval, scalingFactorCheval));
    modelViewMatrix = math.multiply(cameraMatrix, modelViewMatrix);
    modelViewMatrix = math.multiply(modelViewMatrix, yRotation(degToRad(90)));

    drawObject(chevalGeometry, chevalColors, modelViewMatrix);
}

function drawBouclier(cameraMatrix) {
    let modelViewMatrix = translation(-215,-5,-215);
    modelViewMatrix = math.multiply(modelViewMatrix, scaling(scalingFactorBouclier, scalingFactorBouclier, scalingFactorBouclier));
    modelViewMatrix = math.multiply(modelViewMatrix, yRotation(degToRad(45)));
    modelViewMatrix = math.multiply(cameraMatrix, modelViewMatrix);

    drawObject(bouclierGeometry, bouclierColors, modelViewMatrix);
}


function drawEpees(cameraMatrix, ii, numFs) {
    // - définir la matrice de positionnement de l'objet dans la scène
    const angle = ii * Math.PI * 2 / numFs;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    let modelViewMatrix = translation(x, 0, -y);
    modelViewMatrix = math.multiply(modelViewMatrix, scaling(scalingFactorEpees, scalingFactorEpees, scalingFactorEpees));
    modelViewMatrix = math.multiply(translation(0, 90, 0), modelViewMatrix);
    modelViewMatrix = math.multiply(modelViewMatrix, yRotation(-0.5 * Math.PI + angle));
    modelViewMatrix = math.multiply(modelViewMatrix, xRotation(degToRad(90)));
    modelViewMatrix = math.multiply(cameraMatrix, modelViewMatrix);


    drawObject(epeesGeometry, epeesColors, modelViewMatrix);
}

function drawTerrain(cameraMatrix) {
    drawObject(getTerrainGeometry(), terrainColor, cameraMatrix);
}


// Fonction générique de dessin d'objet
function drawObject(geometry, color, modelViewMatrix) {

    // Création des buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(color), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

    gl.uniformMatrix4fv(modelViewMatrixLocation, false, math.flatten(math.transpose(modelViewMatrix)).valueOf());

    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = geometry.length / 3;
    gl.drawArrays(primitiveType, offset, count);
}

//=========================================================
// Définition des couleurs
//=========================================================
// Fonction pour générer des couleurs aléatoires en gradient
function getRandomColors(n, baseColor) {
    const colors = [];
    for (let index = 0; index < n / 2; index++) {
        const faceColor = [baseColor[0] + math.random(0, 15), baseColor[1] + math.random(0, 15), baseColor[2] + math.random(0, 15)]
        for (let index = 0; index < 6; index++) {
            colors.push(...faceColor);
        }
    }
    return colors;
}
