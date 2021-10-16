type Branded<T, U extends string> = T & { [K in U]: never };
export type GLSLExpression<T extends string> = Branded<string, T | 'GLSLExpression'>;
export type GLSLFloatExpression = GLSLExpression<'float'> | number;
export type GLSLToken<T extends string = string> = Branded<string, T | 'GLSLExpression' | 'GLSLToken'>;

type Ex<T extends string> = GLSLExpression<T>;
type Exf = GLSLFloatExpression;
type Tok<T extends string> = GLSLToken<T>;

export type SwizzleComponentVec1 = 'x' | 'r' | 's';
export type SwizzleComponentVec2 = SwizzleComponentVec1 | 'y' | 'g' | 't';
export type SwizzleComponentVec3 = SwizzleComponentVec2 | 'z' | 'b' | 'p';
export type SwizzleComponentVec4 = SwizzleComponentVec3 | 'w' | 'a' | 'q';
export type Swizzle2ComponentsVec1 = `${ SwizzleComponentVec1 }${ SwizzleComponentVec1 }`;
export type Swizzle3ComponentsVec1 = `${ Swizzle2ComponentsVec1 }${ SwizzleComponentVec1 }`;
export type Swizzle4ComponentsVec1 = `${ Swizzle3ComponentsVec1 }${ SwizzleComponentVec1 }`;
export type Swizzle2ComponentsVec2 = `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }`;
export type Swizzle3ComponentsVec2 = `${ Swizzle2ComponentsVec2 }${ SwizzleComponentVec2 }`;
export type Swizzle4ComponentsVec2 = `${ Swizzle3ComponentsVec2 }${ SwizzleComponentVec2 }`;
export type Swizzle2ComponentsVec3 = `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }`;
export type Swizzle3ComponentsVec3 = `${ Swizzle2ComponentsVec3 }${ SwizzleComponentVec3 }`;
export type Swizzle4ComponentsVec3 = `${ Swizzle3ComponentsVec3 }${ SwizzleComponentVec3 }`;
export type Swizzle2ComponentsVec4 = `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }`;
export type Swizzle3ComponentsVec4 = `${ Swizzle2ComponentsVec4 }${ SwizzleComponentVec4 }`;
export type Swizzle4ComponentsVec4 = `${ Swizzle3ComponentsVec4 }${ SwizzleComponentVec4 }`;

// †† the sacred zone of global state ††††††††††††††††††††††††††††††††††††††††††††††††††††††††††††††
const __stack: string[] = [];

const __cache: Map<string, any> = new Map();

let __charIndex = 0;
// †† end of the sacred zone of global state †††††††††††††††††††††††††††††††††††††††††††††††††††††††

function genToken(): string {
  let i = __charIndex;
  let token = '_';
  do {
    token += String.fromCharCode( 97 + ( i % 26 ) );
    i = ( i / 26 ) | 0;
  } while ( i > 0 );
  __charIndex ++;
  return token;
}

function cache<T>( id: string, create: () => T ): T {
  let func = __cache.get( id ) as T | undefined;
  if ( func == null ) {
    func = create();
    __cache.set( id, func );
  }
  return func;
}

const glPosition = 'gl_Position' as Tok<'vec4'>;
const glFragCoord = 'gl_FragCoord' as Tok<'vec4'>;

function insert( code: string ): void {
  __stack[ 0 ] += code;
}

function insertTop( code: string ): void {
  __stack[ __stack.length - 1 ] += code;
}

function num( val: string | number ): Ex<'float'> {
  if ( typeof val === 'string' ) {
    return val as Ex<'float'>;
  }

  let str: string = val.toString( 10 );
  if ( str.indexOf( '.' ) === -1 ) {
    str += '.';
  }
  return str as Ex<'float'>;
}

function def( type: 'float', init?: Exf ): Tok<'float'>;
function def<T extends string>( type: T, init?: Ex<T> ): Tok<T>;
function def( type: string, init?: number | string ): string {
  const token = genToken();
  const initAssign = init != null ? `=${ num( init ) }` : '';
  insert( `${type} ${token}${initAssign};` );
  return token;
}

function defGlobal( type: 'float', init?: Exf ): Tok<'float'>;
function defGlobal<T extends string>( type: T, init?: Ex<T> ): Tok<T>;
function defGlobal( type: string, init?: number | string ): string {
  const token = genToken();
  const initAssign = init != null ? `=${ num( init ) }` : '';
  insertTop( `${type} ${token}${initAssign};` );
  return token;
}

function defConst( type: 'float', init: Exf ): Tok<'float'>;
function defConst<T extends string>( type: T, init: Ex<T> ): Tok<T>;
function defConst( type: string, init: number | string ): string {
  const token = genToken();
  insertTop( `const ${type} ${token}=${ num( init ) };` );
  return token;
}

function defIn<T extends string>( type: T, location: number = 0 ): Tok<T> {
  const token = genToken();
  insertTop( `layout (location = ${location}) in ${type} ${token};` );
  return token as Tok<T>;
}

function defInNamed<T extends string>( type: T, name: string ): Tok<T> {
  insertTop( `in ${type} ${name};` );
  return name as Tok<T>;
}

function defOut<T extends string>( type: T, location: number = 0 ): Tok<T> {
  const token = genToken();
  insertTop( `layout (location = ${location}) out ${type} ${token};` );
  return token as Tok<T>;
}

function defOutNamed<T extends string>( type: T, name: string ): Tok<T> {
  insertTop( `out ${type} ${name};` );
  return name as Tok<T>;
}

function defUniform<T extends string>( type: T, name: string ): Tok<T> {
  insertTop( `uniform ${type} ${name};` );
  return name as Tok<T>;
}

function assign<T extends string>( dst: Tok<T>, src: Ex<T> ): void {
  insert( `${dst}=${src};` );
}

function addAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function addAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> ): void;
function addAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> ): void;
function addAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> ): void;
function addAssign( dst: string, src: string | number ): void {
  insert( `${dst}+=${num( src )};` );
}

function subAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function subAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> ): void;
function subAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> ): void;
function subAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> ): void;
function subAssign( dst: string, src: string | number ): void {
  insert( `${dst}-=${num( src )};` );
}

function mulAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function mulAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> | Ex<'mat2'> ): void;
function mulAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> | Ex<'mat3'> ): void;
function mulAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> | Ex<'mat4'> ): void;
function mulAssign( dst: string, src: string | number ): void {
  insert( `${dst}*=${num( src )};` );
}

function divAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function divAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> ): void;
function divAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> ): void;
function divAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> ): void;
function divAssign( dst: string, src: string | number ): void {
  insert( `${dst}/=${num( src )};` );
}

function add( ...args: Exf[] ): Ex<'float'>;
function add( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
function add( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
function add( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
function add( ...args: ( string | number )[] ): string {
  return `(${args.map( ( val ) => num( val ) ).join( '+' )})`;
}

function sub( ...args: Exf[] ): Ex<'float'>;
function sub( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
function sub( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
function sub( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
function sub( ...args: ( string | number )[] ): string {
  return `(${args.map( ( val ) => num( val ) ).join( '-' )})`;
}

function mul( ...args: Exf[] ): Ex<'float'>;
function mul( ...args: ( Exf | Ex<'vec2'> | Ex<'mat2'> )[] ): Ex<'vec2'>;
function mul( ...args: ( Exf | Ex<'vec3'> | Ex<'mat3'> )[] ): Ex<'vec3'>;
function mul( ...args: ( Exf | Ex<'vec4'> | Ex<'mat4'> )[] ): Ex<'vec4'>;
function mul( ...args: ( string | number )[] ): string {
  return `(${args.map( ( val ) => num( val ) ).join( '*' )})`;
}

function div( ...args: Exf[] ): Ex<'float'>;
function div( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
function div( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
function div( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
function div( ...args: ( string | number )[] ): string {
  return `(${args.map( ( val ) => num( val ) ).join( '/' )})`;
}

function neg( x: Exf ): Ex<'float'>;
function neg( x: Ex<'vec2'> ): Ex<'vec2'>;
function neg( x: Ex<'vec3'> ): Ex<'vec3'>;
function neg( x: Ex<'vec4'> ): Ex<'vec4'>;
function neg( x: string | number ): string {
  return `(-${ x })`;
}

function pow( x: Exf, y: Exf ): Ex<'float'>;
function pow( x: Ex<'vec2'>, y: Ex<'vec2'> ): Ex<'vec2'>;
function pow( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'vec3'>;
function pow( x: Ex<'vec4'>, y: Ex<'vec4'> ): Ex<'vec4'>;
function pow( x: string | number, y: string | number ): string {
  return `pow(${num( x )},${num( y )})`;
}

function sqrt( x: Exf ): Ex<'float'>;
function sqrt( x: Ex<'vec2'> ): Ex<'vec2'>;
function sqrt( x: Ex<'vec3'> ): Ex<'vec3'>;
function sqrt( x: Ex<'vec4'> ): Ex<'vec4'>;
function sqrt( x: string | number ): string {
  return `sqrt(${num( x )})`;
}

function exp( x: Exf ): Ex<'float'>;
function exp( x: Ex<'vec2'> ): Ex<'vec2'>;
function exp( x: Ex<'vec3'> ): Ex<'vec3'>;
function exp( x: Ex<'vec4'> ): Ex<'vec4'>;
function exp( x: string | number ): string {
  return `exp(${num( x )})`;
}

function floor( x: Exf ): Ex<'float'>;
function floor( x: Ex<'vec2'> ): Ex<'vec2'>;
function floor( x: Ex<'vec3'> ): Ex<'vec3'>;
function floor( x: Ex<'vec4'> ): Ex<'vec4'>;
function floor( x: string | number ): string {
  return `floor(${num( x )})`;
}

function fract( x: Exf ): Ex<'float'>;
function fract( x: Ex<'vec2'> ): Ex<'vec2'>;
function fract( x: Ex<'vec3'> ): Ex<'vec3'>;
function fract( x: Ex<'vec4'> ): Ex<'vec4'>;
function fract( x: string | number ): string {
  return `fract(${num( x )})`;
}

function mod( x: Exf, y: Exf ): Ex<'float'>;
function mod( x: Ex<'vec2'>, y: Exf | Ex<'vec2'> ): Ex<'vec2'>;
function mod( x: Ex<'vec3'>, y: Exf | Ex<'vec3'> ): Ex<'vec3'>;
function mod( x: Ex<'vec4'>, y: Exf | Ex<'vec4'> ): Ex<'vec4'>;
function mod( x: string | number, y: string | number ): string {
  return `mod(${ num( x ) },${ num( y ) })`;
}

function abs( x: Exf ): Ex<'float'>;
function abs( x: Ex<'vec2'> ): Ex<'vec2'>;
function abs( x: Ex<'vec3'> ): Ex<'vec3'>;
function abs( x: Ex<'vec4'> ): Ex<'vec4'>;
function abs( x: string | number ): string {
  return `abs(${num( x )})`;
}

function sign( x: Exf ): Ex<'float'>;
function sign( x: Ex<'vec2'> ): Ex<'vec2'>;
function sign( x: Ex<'vec3'> ): Ex<'vec3'>;
function sign( x: Ex<'vec4'> ): Ex<'vec4'>;
function sign( x: string | number ): string {
  return `sign(${num( x )})`;
}

function sin( x: Exf ): Ex<'float'>;
function sin( x: Ex<'vec2'> ): Ex<'vec2'>;
function sin( x: Ex<'vec3'> ): Ex<'vec3'>;
function sin( x: Ex<'vec4'> ): Ex<'vec4'>;
function sin( x: string | number ): string {
  return `sin(${num( x )})`;
}

function cos( x: Exf ): Ex<'float'>;
function cos( x: Ex<'vec2'> ): Ex<'vec2'>;
function cos( x: Ex<'vec3'> ): Ex<'vec3'>;
function cos( x: Ex<'vec4'> ): Ex<'vec4'>;
function cos( x: string | number ): string {
  return `cos(${num( x )})`;
}

function tan( x: Exf ): Ex<'float'>;
function tan( x: Ex<'vec2'> ): Ex<'vec2'>;
function tan( x: Ex<'vec3'> ): Ex<'vec3'>;
function tan( x: Ex<'vec4'> ): Ex<'vec4'>;
function tan( x: string | number ): string {
  return `tan(${num( x )})`;
}

function asin( x: Exf ): Ex<'float'>;
function asin( x: Ex<'vec2'> ): Ex<'vec2'>;
function asin( x: Ex<'vec3'> ): Ex<'vec3'>;
function asin( x: Ex<'vec4'> ): Ex<'vec4'>;
function asin( x: string | number ): string {
  return `asin(${num( x )})`;
}

function acos( x: Exf ): Ex<'float'>;
function acos( x: Ex<'vec2'> ): Ex<'vec2'>;
function acos( x: Ex<'vec3'> ): Ex<'vec3'>;
function acos( x: Ex<'vec4'> ): Ex<'vec4'>;
function acos( x: string | number ): string {
  return `acos(${num( x )})`;
}

function atan( y: Exf, x: Exf ): Ex<'float'>;
function atan( y: Ex<'vec2'>, x: Ex<'vec2'> ): Ex<'vec2'>;
function atan( y: Ex<'vec3'>, x: Ex<'vec3'> ): Ex<'vec3'>;
function atan( y: Ex<'vec4'>, x: Ex<'vec4'> ): Ex<'vec4'>;
function atan( y: string | number, x: string | number ): string {
  return `atan(${ num( y ) }, ${ num( x ) })`;
}

function tern( cond: Ex<'bool'>, truthy: Exf, falsy: Exf ): Ex<'float'>;
function tern( cond: Ex<'bool'>, truthy: Ex<'vec2'>, falsy: Ex<'vec2'> ): Ex<'vec2'>;
function tern( cond: Ex<'bool'>, truthy: Ex<'vec3'>, falsy: Ex<'vec3'> ): Ex<'vec3'>;
function tern( cond: Ex<'bool'>, truthy: Ex<'vec4'>, falsy: Ex<'vec4'> ): Ex<'vec4'>;
function tern( cond: string | number, truthy: string | number, falsy: string | number ): string {
  return `(${cond}?${num( truthy )}:${num( falsy )})`;
}

function length( val: Ex<'vec2'> ): Ex<'float'>;
function length( val: Ex<'vec3'> ): Ex<'float'>;
function length( val: Ex<'vec4'> ): Ex<'float'>;
function length( val: string ): string {
  return `length(${val})`;
}

function normalize( val: Ex<'vec2'> ): Ex<'vec2'>;
function normalize( val: Ex<'vec3'> ): Ex<'vec3'>;
function normalize( val: Ex<'vec4'> ): Ex<'vec4'>;
function normalize( val: string ): string {
  return `normalize(${val})`;
}

function dot( a: Ex<'vec2'>, b: Ex<'vec2'> ): Ex<'float'>;
function dot( a: Ex<'vec3'>, b: Ex<'vec3'> ): Ex<'float'>;
function dot( a: Ex<'vec4'>, b: Ex<'vec4'> ): Ex<'float'>;
function dot( a: string, b: string ): string {
  return `dot(${ a },${ b })`;
}

function cross( a: Ex<'vec3'>, b: Ex<'vec3'> ): Ex<'vec3'>;
function cross( a: string, b: string ): string {
  return `cross(${ a },${ b })`;
}

function reflect( i: Ex<'vec2'>, n: Ex<'vec2'> ): Ex<'vec2'>;
function reflect( i: Ex<'vec3'>, n: Ex<'vec3'> ): Ex<'vec3'>;
function reflect( i: Ex<'vec4'>, n: Ex<'vec4'> ): Ex<'vec4'>;
function reflect( i: string, n: string ): string {
  return `reflect(${ i },${ n })`;
}

function refract( i: Ex<'vec2'>, n: Ex<'vec2'>, eta: Exf ): Ex<'vec2'>;
function refract( i: Ex<'vec3'>, n: Ex<'vec3'>, eta: Exf ): Ex<'vec3'>;
function refract( i: Ex<'vec4'>, n: Ex<'vec4'>, eta: Exf ): Ex<'vec4'>;
function refract( i: string, n: string, eta: string | number ): string {
  return `refract(${ i },${ n },${ num( eta ) })`;
}

function mix( a: Exf, b: Exf, t: Exf ): Ex<'float'>;
function mix( a: Ex<'vec2'>, b: Ex<'vec2'>, t: Exf ): Ex<'vec2'>;
function mix( a: Ex<'vec2'>, b: Ex<'vec2'>, t: Ex<'vec2'> ): Ex<'vec2'>;
function mix( a: Ex<'vec3'>, b: Ex<'vec3'>, t: Exf ): Ex<'vec3'>;
function mix( a: Ex<'vec3'>, b: Ex<'vec3'>, t: Ex<'vec3'> ): Ex<'vec3'>;
function mix( a: Ex<'vec4'>, b: Ex<'vec4'>, t: Exf ): Ex<'vec4'>;
function mix( a: Ex<'vec4'>, b: Ex<'vec4'>, t: Ex<'vec4'> ): Ex<'vec4'>;
function mix( a: string | number, b: string | number, t: string | number ): string {
  return `mix(${num( a )},${num( b )},${num( t )})`;
}

function min( x: Exf, y: Exf ): Ex<'float'>;
function min( x: Ex<'vec2'>, y: Exf ): Ex<'vec2'>;
function min( x: Ex<'vec2'>, y: Ex<'vec2'> ): Ex<'vec2'>;
function min( x: Ex<'vec3'>, y: Exf ): Ex<'vec3'>;
function min( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'vec3'>;
function min( x: Ex<'vec4'>, y: Exf ): Ex<'vec4'>;
function min( x: Ex<'vec4'>, y: Ex<'vec4'> ): Ex<'vec4'>;
function min( x: string | number, y: string | number ): string {
  return `min(${num( x )},${num( y )})`;
}

function max( x: Exf, y: Exf ): Ex<'float'>;
function max( x: Ex<'vec2'>, y: Exf ): Ex<'vec2'>;
function max( x: Ex<'vec2'>, y: Ex<'vec2'> ): Ex<'vec2'>;
function max( x: Ex<'vec3'>, y: Exf ): Ex<'vec3'>;
function max( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'vec3'>;
function max( x: Ex<'vec4'>, y: Exf ): Ex<'vec4'>;
function max( x: Ex<'vec4'>, y: Ex<'vec4'> ): Ex<'vec4'>;
function max( x: string | number, y: string | number ): string {
  return `max(${num( x )},${num( y )})`;
}

function clamp( x: Exf, min: Exf, max: Exf ): Ex<'float'>;
function clamp( x: Ex<'vec2'>, min: Exf, max: Exf ): Ex<'vec2'>;
function clamp( x: Ex<'vec2'>, min: Ex<'vec2'>, max: Ex<'vec2'> ): Ex<'vec2'>;
function clamp( x: Ex<'vec3'>, min: Exf, max: Exf ): Ex<'vec3'>;
function clamp( x: Ex<'vec3'>, min: Ex<'vec3'>, max: Ex<'vec3'> ): Ex<'vec3'>;
function clamp( x: Ex<'vec4'>, min: Exf, max: Exf ): Ex<'vec4'>;
function clamp( x: Ex<'vec4'>, min: Ex<'vec4'>, max: Ex<'vec4'> ): Ex<'vec4'>;
function clamp( x: string | number, min: string | number, max: string | number ): string {
  return `clamp(${ num( x ) },${ num( min ) },${ num( max ) })`;
}

function step( edge: Exf, x: Exf ): Ex<'float'>;
function step( edge: Exf | Ex<'vec2'>, x: Ex<'vec2'> ): Ex<'vec2'>;
function step( edge: Exf | Ex<'vec3'>, x: Ex<'vec3'> ): Ex<'vec3'>;
function step( edge: Exf | Ex<'vec4'>, x: Ex<'vec4'> ): Ex<'vec4'>;
function step( edge: string | number, x: string | number ): string {
  return `step(${ num( edge ) },${ num( x ) })`;
}

function texture( sampler: Ex<'sampler2D'>, uv: Ex<'vec2'> ): Ex<'vec4'>;
function texture( sampler: string, uv: string ): string {
  return `texture(${ sampler },${ uv })`;
}

function eq( x: Exf, y: Exf ): Ex<'bool'>;
function eq( x: Ex<'vec2'>, y: Ex<'vec2'> ): Ex<'bool'>;
function eq( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'bool'>;
function eq( x: Ex<'vec4'>, y: Ex<'vec4'> ): Ex<'bool'>;
function eq( x: string | number, y: string | number ): string {
  return `(${num( x )}==${num( y )})`;
}

function neq( x: Exf, y: Exf ): Ex<'bool'>;
function neq( x: Ex<'vec2'>, y: Ex<'vec2'> ): Ex<'bool'>;
function neq( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'bool'>;
function neq( x: Ex<'vec4'>, y: Ex<'vec4'> ): Ex<'bool'>;
function neq( x: string | number, y: string | number ): string {
  return `(${num( x )}!=${num( y )})`;
}

function lt( x: Exf, y: Exf ): Ex<'bool'>;
function lt( x: string | number, y: string | number ): string {
  return `(${num( x )}<${num( y )})`;
}

function lte( x: Exf, y: Exf ): Ex<'bool'>;
function lte( x: string | number, y: string | number ): string {
  return `(${num( x )}<=${num( y )})`;
}

function gt( x: Exf, y: Exf ): Ex<'bool'>;
function gt( x: string | number, y: string | number ): string {
  return `(${num( x )}>${num( y )})`;
}

function gte( x: Exf, y: Exf ): Ex<'bool'>;
function gte( x: string | number, y: string | number ): string {
  return `(${num( x )}>=${num( y )})`;
}

function float( val: string | number ): Ex<'float'> {
  return `float(${val})` as Ex<'float'>;
}

function vec2( ...args: ( string | number )[] ): Ex<'vec2'> {
  return `vec2(${args.join( ',' )})` as Ex<'vec2'>;
}

function vec3( ...args: ( string | number )[] ): Ex<'vec3'> {
  return `vec3(${args.join( ',' )})` as Ex<'vec3'>;
}

function vec4( ...args: ( string | number )[] ): Ex<'vec4'> {
  return `vec4(${args.join( ',' )})` as Ex<'vec4'>;
}

function mat2( ...args: ( string | number )[] ): Ex<'mat2'> {
  return `mat2(${args.join( ',' )})` as Ex<'mat2'>;
}

function mat3( ...args: ( string | number )[] ): Ex<'mat3'> {
  return `mat3(${args.join( ',' )})` as Ex<'mat3'>;
}

function mat4( ...args: ( string | number )[] ): Ex<'mat4'> {
  return `mat4(${args.join( ',' )})` as Ex<'mat4'>;
}

/* eslint-disable max-len */
function swizzle( val: Tok<'vec2'>, swizzle: SwizzleComponentVec2 ): Tok<'float'>;
function swizzle( val: Tok<'vec2'>, swizzle: Swizzle2ComponentsVec2 ): Tok<'vec2'>;
function swizzle( val: Tok<'vec2'>, swizzle: Swizzle3ComponentsVec2 ): Tok<'vec3'>;
function swizzle( val: Tok<'vec2'>, swizzle: Swizzle4ComponentsVec2 ): Tok<'vec4'>;
function swizzle( val: Tok<'vec3'>, swizzle: SwizzleComponentVec3 ): Tok<'float'>;
function swizzle( val: Tok<'vec3'>, swizzle: Swizzle2ComponentsVec3 ): Tok<'vec2'>;
function swizzle( val: Tok<'vec3'>, swizzle: Swizzle3ComponentsVec3 ): Tok<'vec3'>;
function swizzle( val: Tok<'vec3'>, swizzle: Swizzle4ComponentsVec3 ): Tok<'vec4'>;
function swizzle( val: Tok<'vec4'>, swizzle: SwizzleComponentVec4 ): Tok<'float'>;
function swizzle( val: Tok<'vec4'>, swizzle: Swizzle2ComponentsVec4 ): Tok<'vec2'>;
function swizzle( val: Tok<'vec4'>, swizzle: Swizzle3ComponentsVec4 ): Tok<'vec3'>;
function swizzle( val: Tok<'vec4'>, swizzle: Swizzle4ComponentsVec4 ): Tok<'vec4'>;
function swizzle( val: Ex<'vec2'>, swizzle: SwizzleComponentVec2 ): Ex<'float'>;
function swizzle( val: Ex<'vec2'>, swizzle: Swizzle2ComponentsVec2 ): Ex<'vec2'>;
function swizzle( val: Ex<'vec2'>, swizzle: Swizzle3ComponentsVec2 ): Ex<'vec3'>;
function swizzle( val: Ex<'vec2'>, swizzle: Swizzle4ComponentsVec2 ): Ex<'vec4'>;
function swizzle( val: Ex<'vec3'>, swizzle: SwizzleComponentVec3 ): Ex<'float'>;
function swizzle( val: Ex<'vec3'>, swizzle: Swizzle2ComponentsVec3 ): Ex<'vec2'>;
function swizzle( val: Ex<'vec3'>, swizzle: Swizzle3ComponentsVec3 ): Ex<'vec3'>;
function swizzle( val: Ex<'vec3'>, swizzle: Swizzle4ComponentsVec3 ): Ex<'vec4'>;
function swizzle( val: Ex<'vec4'>, swizzle: SwizzleComponentVec4 ): Ex<'float'>;
function swizzle( val: Ex<'vec4'>, swizzle: Swizzle2ComponentsVec4 ): Ex<'vec2'>;
function swizzle( val: Ex<'vec4'>, swizzle: Swizzle3ComponentsVec4 ): Ex<'vec3'>;
function swizzle( val: Ex<'vec4'>, swizzle: Swizzle4ComponentsVec4 ): Ex<'vec4'>;
/* eslint-enable max-len */
function swizzle( val: string, swizzle: string ): string {
  return `${val}.${swizzle}`;
}

function discard(): void {
  insert( 'discard;' );
}

function retFn( val: string | number ): void {
  insert( `return ${val};` );
}

function ifThen( condition: Ex<'bool'>, truthy: () => void, falsy?: () => void ): void {
  __stack.unshift( '' );
  truthy();
  const t = __stack.shift();
  insert( `if(${ condition }){${ t }}` );

  if ( falsy != null ) {
    __stack.unshift( '' );
    falsy();
    const f = __stack.shift();
    insert( `else{${ f }}` );
  }
}

function unrollLoop( count: number, func: ( count: number ) => void ): void {
  [ ...Array( count ) ].forEach( ( _, i ) => {
    __stack.unshift( '' );
    func( i );
    const procedure = __stack.shift();
    insert( `{${ procedure }}` );
  } );
}

function forLoop( count: number, func: ( count: GLSLExpression<'int'> ) => void ): void {
  const loopToken = genToken() as GLSLExpression<'int'>;
  __stack.unshift( '' );
  func( loopToken );
  const procedure = __stack.shift();
  insert( `for(int ${ loopToken }=0;${ loopToken }<${ count };${ loopToken }++){${ procedure }}` );
}

function forBreak(): void {
  insert( 'break;' );
}

/* eslint-disable max-len */
function defFn<T extends string>( returnType: T, argsType: [], build: () => void ): () => Ex<T>;
function defFn<T extends string, TArg1 extends string>(
  returnType: T,
  argsType: [ TArg1 ],
  build: ( arg1: Tok<TArg1> ) => void
): ( arg1: Ex<TArg1> ) => Ex<T>;
function defFn<T extends string, TArg1 extends string, TArg2 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2> ) => Ex<T>;
function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3> ) => Ex<T>;
function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string, TArg4 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3, TArg4 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3>, arg4: Tok<TArg3> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3>, arg4: Ex<TArg4> ) => Ex<T>;
/* eslint-enable max-len */
function defFn<T extends string, TArgs extends string[]>(
  returnType: T,
  argsType: TArgs,
  build: ( ...args: Tok<string>[] ) => void,
): ( ...args: Ex<string>[] ) => Ex<T> {
  const token = genToken();

  const argsTypeTokenPair = argsType.map( ( type ) => [ type, genToken() ] );
  const argsToken = argsTypeTokenPair.map( ( [ _, token ] ) => token );
  const argsStatement = argsTypeTokenPair.map( ( arr ) => arr.join( ' ' ) ).join( ',' );

  __stack.unshift( '' );
  ( build as any )( ...argsToken );
  const procedure = __stack.shift();

  insertTop( `${returnType} ${token}(${argsStatement}){${ procedure }}` );

  return ( ...args ) => `${token}(${args.join( ',' )})` as Ex<T>;
}

function main( builder: () => void ): void {
  __stack.unshift( '' );
  builder();
  const procedure = __stack.shift();
  insert( `void main(){${ procedure }}` );
}

function build( builder: () => void ): string {
  __stack.unshift( '#version 300 es\n' );
  __charIndex = 0;

  builder();

  __cache.clear();
  return __stack.shift()!;
}

/* eslint-disable max-len */
export const shaderBuilder = {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
};
/* eslint-enable max-len */
