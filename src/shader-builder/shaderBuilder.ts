export type GLSLExpression<T extends string> = string & {
  __type: T,
  __glslExpression: true,
};
export type GLSLFloatExpression = GLSLExpression<'float'> | number;
export type GLSLToken<T extends string = string> = string & {
  __type: T,
  __glslExpression: true,
  __glslToken: true,
};

export type GLSLGenType = 'float' | 'vec2' | 'vec3' | 'vec4';

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

const __cache: Map<symbol, any> = new Map();

let __charIndex = 0;
// †† end of the sacred zone of global state †††††††††††††††††††††††††††††††††††††††††††††††††††††††

export function genToken(): string {
  let i = __charIndex;
  let token = '_';
  do {
    token += String.fromCharCode( 97 + ( i % 26 ) );
    i = ( i / 26 ) | 0;
  } while ( i > 0 );
  __charIndex ++;
  return token;
}

export function cache<T>( id: symbol, create: () => T ): T {
  let func = __cache.get( id ) as T | undefined;
  if ( func == null ) {
    func = create();
    __cache.set( id, func );
  }
  return func;
}

export const glPosition = 'gl_Position' as Tok<'vec4'>;
export const glPointSize = 'gl_PointSize' as Tok<'float'>;
export const glPointCoord = 'gl_PointCoord' as Tok<'vec2'>;
export const glFragCoord = 'gl_FragCoord' as Tok<'vec4'>;
export const glFragColor = 'gl_FragColor' as Tok<'vec4'>;
export const glFragDepth = 'gl_FragDepth' as Tok<'float'>;

export function insert( code: string ): void {
  __stack[ 0 ] += code;
}

export function insertTop( code: string ): void {
  __stack[ __stack.length - 1 ] += code;
}

export function num( val: string | number ): Ex<'float'> {
  if ( typeof val === 'string' ) {
    return val as Ex<'float'>;
  }

  let str: string = val.toString( 10 );
  if ( str.indexOf( '.' ) === -1 ) {
    str += '.';
  }
  return str as Ex<'float'>;
}

function __def( { type, init, location, name, modifier, local }: {
  type: string,
  init?: string | number,
  location?: number,
  name?: string,
  modifier?: string,
  local?: boolean,
} ): string {
  const token = name ?? genToken();

  ( local ? insert : insertTop )( [
    location ? `layout (location=${ location })` : '',
    modifier ?? '',
    type ?? '',
    token,
    init ? `=${ num( init ) }` : '',
    ';',
  ].join( ' ' ) );

  return token;
}

export const def: {
  ( type: 'float', init?: Exf ): Tok<'float'>;
  <T extends string>( type: T, init?: Ex<T> ): Tok<T>;
} = ( type: string, init?: string | number ) => __def( {
  type,
  init,
  local: true,
} ) as any;

export const defGlobal: {
  ( type: 'float', init?: Exf ): Tok<'float'>;
  <T extends string>( type: T, init?: Ex<T> ): Tok<T>;
} = ( type: string, init?: string | number ) => __def( {
  type,
  init,
} ) as any;

export const defConst: {
  ( type: 'float', init?: Exf ): Tok<'float'>;
  <T extends string>( type: T, init?: Ex<T> ): Tok<T>;
} = ( type: string, init?: string | number ) => __def( {
  type,
  init,
  modifier: 'const',
} ) as any;

export const defIn: {
  <T extends string>( type: T, location?: number ): Tok<T>;
} = ( type: string, location: number = 0 ) => __def( {
  type,
  location,
  modifier: 'in',
} ) as any;

export const defInNamed: {
  <T extends string>( type: T, name: string ): Tok<T>;
} = ( type: string, name: string ) => __def( {
  type,
  name,
  modifier: 'in',
} ) as any;

export const defOut: {
  <T extends string>( type: T, location?: number ): Tok<T>;
} = ( type: string, location: number = 0 ) => __def( {
  type,
  location,
  modifier: 'out',
} ) as any;

export const defOutNamed: {
  <T extends string>( type: T, name: string ): Tok<T>;
} = ( type: string, name: string ) => __def( {
  type,
  name,
  modifier: 'out',
} ) as any;

export const defUniformNamed: {
  <T extends string>( type: T, name: string ): Tok<T>;
} = ( type: string, name: string ) => __def( {
  type,
  name,
  modifier: 'uniform',
} ) as any;

export const assign: {
  <T extends GLSLGenType>( dst: Ex<T>, src: Exf ): void;
  <T extends GLSLGenType>( dst: Ex<T>, src: Ex<T> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}=${num( src )};` )
);

export const addAssign: {
  <T extends GLSLGenType>( dst: Ex<T>, src: Exf ): void;
  <T extends GLSLGenType>( dst: Ex<T>, src: Ex<T> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}+=${num( src )};` )
);

export const subAssign: {
  <T extends GLSLGenType>( dst: Ex<T>, src: Exf ): void;
  <T extends GLSLGenType>( dst: Ex<T>, src: Ex<T> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}-=${num( src )};` )
);

export const mulAssign: {
  <T extends GLSLGenType>( dst: Ex<T>, src: Exf ): void;
  <T extends GLSLGenType>( dst: Ex<T>, src: Ex<T> ): void;
  ( dst: Ex<'vec2'>, src: Ex<'mat2'> ): void;
  ( dst: Ex<'vec3'>, src: Ex<'mat3'> ): void;
  ( dst: Ex<'vec4'>, src: Ex<'mat4'> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}*=${num( src )};` )
);

export const divAssign: {
  <T extends GLSLGenType>( dst: Ex<T>, src: Exf ): void;
  <T extends GLSLGenType>( dst: Ex<T>, src: Ex<T> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}/=${num( src )};` )
);

export const add: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '+' )})`
) as any;

export const sub: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '-' )})`
) as any;

export const mul: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Exf | Ex<'vec2'> | Ex<'mat2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> | Ex<'mat3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> | Ex<'mat4'> )[] ): Ex<'vec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '*' )})`
) as any;

export const div: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '/' )})`
) as any;

export const neg: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Exf | Ex<T> ): Ex<T>;
} = ( x: string | number ) => (
  `(-${ x })`
) as any;

export const tern: {
  ( cond: Ex<'bool'>, truthy: Exf, falsy: Exf ): Ex<'float'>;
  <T extends string>( cond: Ex<'bool'>, truthy: Ex<T>, falsy: Ex<T> ): Ex<T>;
} = ( cond: string, truthy: string | number, falsy: string | number ) => (
  `(${cond}?${num( truthy )}:${num( falsy )})`
) as any;

export const eq: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  <T extends string>( x: Ex<T>, y: Ex<T> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}==${num( y )})`
) as any;

export const neq: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  <T extends string>( x: Ex<T>, y: Ex<T> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}!=${num( y )})`
) as any;

export const lt: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}<${num( y )})`
) as any;

export const lte: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}<=${num( y )})`
) as any;

export const gt: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}>${num( y )})`
) as any;

export const gte: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}>=${num( y )})`
) as any;

export const sw: {
  ( val: Tok<'vec2'>, swizzle: SwizzleComponentVec2 ): Tok<'float'>;
  ( val: Tok<'vec2'>, swizzle: Swizzle2ComponentsVec2 ): Tok<'vec2'>;
  ( val: Tok<'vec2'>, swizzle: Swizzle3ComponentsVec2 ): Tok<'vec3'>;
  ( val: Tok<'vec2'>, swizzle: Swizzle4ComponentsVec2 ): Tok<'vec4'>;
  ( val: Tok<'vec3'>, swizzle: SwizzleComponentVec3 ): Tok<'float'>;
  ( val: Tok<'vec3'>, swizzle: Swizzle2ComponentsVec3 ): Tok<'vec2'>;
  ( val: Tok<'vec3'>, swizzle: Swizzle3ComponentsVec3 ): Tok<'vec3'>;
  ( val: Tok<'vec3'>, swizzle: Swizzle4ComponentsVec3 ): Tok<'vec4'>;
  ( val: Tok<'vec4'>, swizzle: SwizzleComponentVec4 ): Tok<'float'>;
  ( val: Tok<'vec4'>, swizzle: Swizzle2ComponentsVec4 ): Tok<'vec2'>;
  ( val: Tok<'vec4'>, swizzle: Swizzle3ComponentsVec4 ): Tok<'vec3'>;
  ( val: Tok<'vec4'>, swizzle: Swizzle4ComponentsVec4 ): Tok<'vec4'>;
  ( val: Ex<'vec2'>, swizzle: SwizzleComponentVec2 ): Ex<'float'>;
  ( val: Ex<'vec2'>, swizzle: Swizzle2ComponentsVec2 ): Ex<'vec2'>;
  ( val: Ex<'vec2'>, swizzle: Swizzle3ComponentsVec2 ): Ex<'vec3'>;
  ( val: Ex<'vec2'>, swizzle: Swizzle4ComponentsVec2 ): Ex<'vec4'>;
  ( val: Ex<'vec3'>, swizzle: SwizzleComponentVec3 ): Ex<'float'>;
  ( val: Ex<'vec3'>, swizzle: Swizzle2ComponentsVec3 ): Ex<'vec2'>;
  ( val: Ex<'vec3'>, swizzle: Swizzle3ComponentsVec3 ): Ex<'vec3'>;
  ( val: Ex<'vec3'>, swizzle: Swizzle4ComponentsVec3 ): Ex<'vec4'>;
  ( val: Ex<'vec4'>, swizzle: SwizzleComponentVec4 ): Ex<'float'>;
  ( val: Ex<'vec4'>, swizzle: Swizzle2ComponentsVec4 ): Ex<'vec2'>;
  ( val: Ex<'vec4'>, swizzle: Swizzle3ComponentsVec4 ): Ex<'vec3'>;
  ( val: Ex<'vec4'>, swizzle: Swizzle4ComponentsVec4 ): Ex<'vec4'>;
} = ( val: string, swizzle: string ) => (
  `${val}.${swizzle}`
) as any;

function __callFn( name: string ): ( ...args: ( string | number )[] ) => string {
  return ( ...args ) => (
    `${ name }(${ args.map( ( arg ) => num( arg ) ).join( ',' ) })`
  );
}

export const pow: {
  ( x: Exf, y: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, y: Ex<T> ): Ex<T>;
} = __callFn( 'pow' ) as any;

export const sqrt: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'sqrt' ) as any;

export const log: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'log' ) as any;

export const log2: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'log2' ) as any;

export const exp: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'exp' ) as any;

export const floor: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'floor' ) as any;

export const fract: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'fract' ) as any;

export const mod: {
  ( x: Exf, y: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, y: Exf ): Ex<T>;
  <T extends GLSLGenType>( x: Ex<T>, y: Ex<T> ): Ex<T>;
} = __callFn( 'mod' ) as any;

export const abs: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'abs' ) as any;

export const sign: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'sign' ) as any;

export const sin: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'sin' ) as any;

export const cos: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'cos' ) as any;

export const tan: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'tan' ) as any;

export const asin: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'asin' ) as any;

export const acos: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'acos' ) as any;

export const atan: {
  ( x: Exf, y: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, y: Ex<T> ): Ex<T>;
} = __callFn( 'atan' ) as any;

export const length: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( x: Ex<T> ): Ex<'float'>;
} = __callFn( 'length' ) as any;

export const normalize: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( x: Ex<T> ): Ex<T>;
} = __callFn( 'normalize' ) as any;

export const dot: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( x: Ex<T>, y: Ex<T> ): Ex<'float'>;
} = __callFn( 'dot' ) as any;

export const cross: {
  ( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'vec3'>;
} = __callFn( 'cross' ) as any;

export const reflect: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( i: Ex<T>, n: Ex<T> ): Ex<T>;
} = __callFn( 'reflect' ) as any;

export const refract: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( i: Ex<T>, n: Ex<T>, eta: Exf ): Ex<T>;
} = __callFn( 'refract' ) as any;

export const mix: {
  ( a: Exf, b: Exf, t: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( a: Ex<T>, b: Ex<T>, t: Exf ): Ex<T>;
  <T extends GLSLGenType>( a: Ex<T>, b: Ex<T>, t: Ex<T> ): Ex<T>;
} = __callFn( 'mix' ) as any;

export const min: {
  ( a: Exf, b: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( a: Ex<T>, b: Exf ): Ex<T>;
  <T extends GLSLGenType>( a: Ex<T>, b: Ex<T> ): Ex<T>;
} = __callFn( 'min' ) as any;

export const max: {
  ( a: Exf, b: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( a: Ex<T>, b: Exf ): Ex<T>;
  <T extends GLSLGenType>( a: Ex<T>, b: Ex<T> ): Ex<T>;
} = __callFn( 'max' ) as any;

export const clamp: {
  ( x: Exf, min: Exf, max: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, min: Exf, max: Exf ): Ex<T>;
  <T extends GLSLGenType>( x: Ex<T>, min: Ex<T>, max: Ex<T> ): Ex<T>;
} = __callFn( 'clamp' ) as any;

export const step: {
  ( edge: Exf, x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( edge: Exf, x: Ex<T> ): Ex<T>;
  <T extends GLSLGenType>( edge: Ex<T>, x: Ex<T> ): Ex<T>;
} = __callFn( 'step' ) as any;

export const texture: {
  ( sampler: Ex<'sampler2D'>, x: Ex<'vec2'> ): Ex<'vec4'>;
} = __callFn( 'texture' ) as any;

export const float: {
  ( val: Exf ): Ex<'float'>;
} = __callFn( 'float' ) as any;

type Vec2Args = [ Exf, Exf ] | [ Ex<'vec2'> ];
export const vec2: {
  ( ...args: Vec2Args ): Ex<'vec2'>;
  ( scalar: Exf ): Ex<'vec2'>;
} = __callFn( 'vec2' ) as any;

type Vec3Args = [ ...Vec2Args, Exf ] | [ Exf, ...Vec2Args ] | [ Ex<'vec3'> ];
export const vec3: {
  ( ...args: Vec3Args ): Ex<'vec3'>;
  ( scalar: Exf ): Ex<'vec3'>;
} = __callFn( 'vec3' ) as any;

type Vec4Args = [ ...Vec3Args, Exf ] | [ ...Vec2Args, ...Vec2Args ] | [ Exf, ...Vec3Args ] | [ Ex<'vec4'> ];
export const vec4: {
  ( ...args: Vec4Args ): Ex<'vec4'>;
  ( scalar: Exf ): Ex<'vec4'>;
} = __callFn( 'vec4' ) as any;

// TODO: type
export const mat2 = __callFn( 'mat2' );
export const mat3 = __callFn( 'mat3' );
export const mat4 = __callFn( 'mat4' );

export function discard(): void {
  insert( 'discard;' );
}

export function retFn( val: string | number ): void {
  insert( `return ${val};` );
}

export function ifThen( condition: Ex<'bool'>, truthy: () => void, falsy?: () => void ): void {
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

export function unrollLoop( count: number, func: ( count: number ) => void ): void {
  [ ...Array( count ) ].forEach( ( _, i ) => {
    __stack.unshift( '' );
    func( i );
    const procedure = __stack.shift();
    insert( `{${ procedure }}` );
  } );
}

export function forLoop( count: number, func: ( count: GLSLExpression<'int'> ) => void ): void {
  const loopToken = genToken() as GLSLExpression<'int'>;
  __stack.unshift( '' );
  func( loopToken );
  const procedure = __stack.shift();
  insert( `for(int ${ loopToken }=0;${ loopToken }<${ count };${ loopToken }++){${ procedure }}` );
}

export function forBreak(): void {
  insert( 'break;' );
}

/* eslint-disable max-len */
export function defFn<T extends string>( returnType: T, argsType: [], build: () => void ): () => Ex<T>;
export function defFn<T extends string, TArg1 extends string>(
  returnType: T,
  argsType: [ TArg1 ],
  build: ( arg1: Tok<TArg1> ) => void
): ( arg1: Ex<TArg1> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string, TArg4 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3, TArg4 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3>, arg4: Tok<TArg4> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3>, arg4: Ex<TArg4> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string, TArg4 extends string, TArg5 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3, TArg4, TArg5 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3>, arg4: Tok<TArg4>, arg5: Tok<TArg5> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3>, arg4: Ex<TArg4>, arg5: Ex<TArg5> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string, TArg4 extends string, TArg5 extends string, TArg6 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3, TArg4, TArg5, TArg6 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3>, arg4: Tok<TArg4>, arg5: Tok<TArg5>, arg6: Tok<TArg6> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3>, arg4: Ex<TArg4>, arg5: Ex<TArg5>, arg6: Ex<TArg6> ) => Ex<T>;
/* eslint-enable max-len */
export function defFn<T extends string, TArgs extends string[]>(
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

  return __callFn( token ) as any;
}

export function main( builder: () => void ): void {
  __stack.unshift( '' );
  builder();
  const procedure = __stack.shift();
  insert( `void main(){${ procedure }}` );
}

export function build( builder: () => void ): string {
  __stack.unshift( '#version 300 es\n' );
  __charIndex = 0;

  builder();

  __cache.clear();
  return __stack.shift()!;
}
