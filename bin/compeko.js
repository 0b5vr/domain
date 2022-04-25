#!/usr/bin/env node

// compeko - pack JavaScript into a self-extracting html+deflate

// Copyright (c) 2022 0b5vr
// SPDX-License-Identifier: MIT

// Usage:
// - prepare a js code, which will be fed into `eval`
// - install `node-zopfli` as your (dev-) dependency
// - run: node compeko.js input.js output.html

// Shoutouts to:
// - gasman, for pnginator ... https://gist.github.com/gasman/2560551
// - Charles Boccato, for JsExe ... https://www.pouet.net/prod.php?which=59298

// =================================================================================================

// -- sanity check ---------------------------------------------------------------------------------
try {
  require( 'node-zopfli' );
} catch ( e ) {
  console.error( e );
  console.error( `
\x1b[31mMake sure you installed \x1b[35mnode-zopfli\x1b[31m !\x1b[0m` );
}

if ( process.argv[ 3 ] == null ) {
  console.error( '\x1b[31mUsage: \x1b[35mnode compeko.js input.js output.html\x1b[0m' );
  process.exit( 1 );
}

// -- modules --------------------------------------------------------------------------------------
const { readFileSync, writeFileSync } = require( 'fs' );
const { resolve } = require( 'path' );
const zopfli = require( 'node-zopfli' );
const zlib = require( 'zlib' );

// -- main -----------------------------------------------------------------------------------------
console.info( 'Compressing the file...' );

const inputPath = resolve( process.cwd(), process.argv[ 2 ] );
const outputPath = resolve( process.cwd(), process.argv[ 3 ] );

const inputFile = readFileSync( inputPath );
const inputSize = inputFile.length;
console.info( `Input size: \x1b[32m${ inputSize.toLocaleString() } bytes\x1b[0m` );

const compressed = zopfli.zlibSync( inputFile, {
  numiterations: 100, // increase this number to shave your last bytes
  blocksplitting: true,
} );

const header = '<script>fetch("#").then(t=>t.blob()).then(t=>new Response(t.slice(156).stream().pipeThrough(new DecompressionStream("deflate"))).text()).then(eval)</script>';
const headerBuffer = Buffer.alloc( header.length );
headerBuffer.write( header );

const concated = Buffer.concat( [ headerBuffer, compressed ] );

const outputSize = concated.length;
const percentage = ( 100.0 * ( outputSize / inputSize ) ).toFixed( '3' );
console.info( `Output size: \x1b[32m${ outputSize.toLocaleString() } bytes\x1b[0m (${ percentage } %)` );

writeFileSync( outputPath, concated );

console.info( 'Done \x1b[32m✓\x1b[0m' );
