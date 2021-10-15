type Branded<T, U extends string> = T & { [K in U]: never };
export type GLSLExpression<T extends string> = Branded<string, T | 'GLSLExpression'>;
export type GLSLFloatExpression = GLSLExpression<'float'> | number;
export type GLSLToken<T extends string = string> = Branded<string, T | 'GLSLExpression' | 'GLSLToken'>;

type Ex<T extends string> = GLSLExpression<T>;
type Exf = GLSLFloatExpression;
type Tok<T extends string> = GLSLToken<T>;

const stack: string[] = [];

let charIndex = 0;

function genToken(): string {
  let i = charIndex;
  let token = '_';
  do {
    token += String.fromCharCode( 97 + ( i % 26 ) );
    i = ( i / 26 ) | 0;
  } while ( i > 0 );
  charIndex ++;
  return token;
}

const glPosition = 'gl_Position' as Tok<'vec4'>;
const glFragCoord = 'gl_FragCoord' as Tok<'vec4'>;

function insert( code: string ): void {
  stack[ 0 ] += code;
}

function insertTop( code: string ): void {
  stack[ stack.length - 1 ] += code;
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

function def<T extends string>( type: T, init?: Ex<T> ): Tok<T> {
  const token = genToken();
  const initAssign = init != null ? `=${init}` : '';
  stack[ 0 ] += `${type} ${token}${initAssign};`;
  return token as Tok<T>;
}

function defIn<T extends string>( type: T, location: number = 0 ): Tok<T> {
  const token = genToken();
  stack[ 0 ] += `layout (location = ${location}) in ${type} ${token};`;
  return token as Tok<T>;
}

function defInNamed<T extends string>( type: T, name: string ): Tok<T> {
  stack[ 0 ] += `in ${type} ${name};`;
  return name as Tok<T>;
}

function defOut<T extends string>( type: T, location: number = 0 ): Tok<T> {
  const token = genToken();
  stack[ 0 ] += `layout (location = ${location}) out ${type} ${token};`;
  return token as Tok<T>;
}

function defOutNamed<T extends string>( type: T, name: string ): Tok<T> {
  stack[ 0 ] += `out ${type} ${name};`;
  return name as Tok<T>;
}

function defUniform<T extends string>( type: T, name: string ): Tok<T> {
  stack[ 0 ] += `uniform ${type} ${name};`;
  return name as Tok<T>;
}

function assign<T extends string>( dst: Tok<T>, src: Ex<T> ): void {
  stack[ 0 ] += `${dst}=${src};`;
}

function addAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function addAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> ): void;
function addAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> ): void;
function addAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> ): void;
function addAssign( dst: string, src: string | number ): void {
  stack[ 0 ] += `${dst}+=${num( src )};`;
}

function subAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function subAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> ): void;
function subAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> ): void;
function subAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> ): void;
function subAssign( dst: string, src: string | number ): void {
  stack[ 0 ] += `${dst}-=${num( src )};`;
}

function mulAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function mulAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> ): void;
function mulAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> ): void;
function mulAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> ): void;
function mulAssign( dst: string, src: string | number ): void {
  stack[ 0 ] += `${dst}*=${num( src )};`;
}

function divAssign( dst: Tok<'float'> | Tok<'vec2'> | Tok<'vec3'> | Tok<'vec4'>, src: Exf ): void;
function divAssign( dst: Tok<'vec2'>, src: Ex<'vec2'> ): void;
function divAssign( dst: Tok<'vec3'>, src: Ex<'vec3'> ): void;
function divAssign( dst: Tok<'vec4'>, src: Ex<'vec4'> ): void;
function divAssign( dst: string, src: string | number ): void {
  stack[ 0 ] += `${dst}/=${num( src )};`;
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
  return `dot(${ a }, ${ b })`;
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

type SwizzleComponentVec1 = 'x' | 'r' | 's';
type SwizzleComponentVec2 = SwizzleComponentVec1 | 'y' | 'g' | 't';
type SwizzleComponentVec3 = SwizzleComponentVec2 | 'z' | 'b' | 'p';
type SwizzleComponentVec4 = SwizzleComponentVec3 | 'w' | 'a' | 'q';

/* eslint-disable max-len */
function swizzle( val: Tok<'vec2'>, swizzle: `${ SwizzleComponentVec2 }` ): Tok<'float'>;
function swizzle( val: Tok<'vec2'>, swizzle: `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }` ): Tok<'vec2'>;
function swizzle( val: Tok<'vec2'>, swizzle: `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }` ): Tok<'vec3'>;
function swizzle( val: Tok<'vec2'>, swizzle: `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }` ): Tok<'vec4'>;
function swizzle( val: Tok<'vec3'>, swizzle: `${ SwizzleComponentVec3 }` ): Tok<'float'>;
function swizzle( val: Tok<'vec3'>, swizzle: `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }` ): Tok<'vec2'>;
function swizzle( val: Tok<'vec3'>, swizzle: `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }` ): Tok<'vec3'>;
function swizzle( val: Tok<'vec3'>, swizzle: `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }` ): Tok<'vec4'>;
function swizzle( val: Tok<'vec4'>, swizzle: `${ SwizzleComponentVec4 }` ): Tok<'float'>;
function swizzle( val: Tok<'vec4'>, swizzle: `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }` ): Tok<'vec2'>;
function swizzle( val: Tok<'vec4'>, swizzle: `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }` ): Tok<'vec3'>;
function swizzle( val: Tok<'vec4'>, swizzle: `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }` ): Tok<'vec4'>;
function swizzle( val: Ex<'vec2'>, swizzle: `${ SwizzleComponentVec2 }` ): Ex<'float'>;
function swizzle( val: Ex<'vec2'>, swizzle: `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }` ): Ex<'vec2'>;
function swizzle( val: Ex<'vec2'>, swizzle: `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }` ): Ex<'vec3'>;
function swizzle( val: Ex<'vec2'>, swizzle: `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }` ): Ex<'vec4'>;
function swizzle( val: Ex<'vec3'>, swizzle: `${ SwizzleComponentVec3 }` ): Ex<'float'>;
function swizzle( val: Ex<'vec3'>, swizzle: `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }` ): Ex<'vec2'>;
function swizzle( val: Ex<'vec3'>, swizzle: `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }` ): Ex<'vec3'>;
function swizzle( val: Ex<'vec3'>, swizzle: `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }` ): Ex<'vec4'>;
function swizzle( val: Ex<'vec4'>, swizzle: `${ SwizzleComponentVec4 }` ): Ex<'float'>;
function swizzle( val: Ex<'vec4'>, swizzle: `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }` ): Ex<'vec2'>;
function swizzle( val: Ex<'vec4'>, swizzle: `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }` ): Ex<'vec3'>;
function swizzle( val: Ex<'vec4'>, swizzle: `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }` ): Ex<'vec4'>;
/* eslint-enable max-len */
function swizzle( val: string, swizzle: string ): string {
  return `${val}.${swizzle}`;
}

function discard(): void {
  stack[ 0 ] += 'discard;';
}

function retFn( val: string | number ): void {
  stack[ 0 ] += `return ${val};`;
}

function ifThen( condition: Ex<'bool'>, truthy: () => void, falsy?: () => void ): void {
  stack.unshift( '' );
  truthy();
  const t = stack.shift();
  stack[ 0 ] += `if(${ condition }){${ t }}`;

  if ( falsy != null ) {
    stack.unshift( '' );
    falsy();
    const f = stack.shift();
    stack[ 0 ] += `else{${ f }}`;
  }
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

  stack.unshift( '' );
  ( build as any )( ...argsToken );
  const procedure = stack.shift();

  stack[ 0 ] += `${returnType} ${token}(${argsStatement}){${ procedure }}`;

  return ( ...args ) => `${token}(${args.join( '.' )})` as Ex<T>;
}

function main( builder: () => void ): void {
  stack.unshift( '' );
  builder();
  const procedure = stack.shift();
  stack[ 0 ] += `void main(){${ procedure }}`;
}

function build( builder: () => void ): string {
  stack.unshift( '#version 300 es\n' );
  charIndex = 0;

  builder();

  return stack.shift()!;
}

/* eslint-disable max-len */
export const shaderBuilder = { glPosition, glFragCoord, genToken, insert, insertTop, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, sqrt, exp, sin, cos, tan, tern, length, normalize, dot, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, swizzle, discard, retFn, ifThen, defFn, main, build };
/* eslint-enable max-len */
