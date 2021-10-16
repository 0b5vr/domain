import { cache, genToken, insertTop } from '../../shader-builder/shaderBuilder';
import { glslSaturate } from './glslSaturate';

export function glslLinearstep( a: string, b: string, x: string ): string {
  const linearstep = cache( 'linearstep', () => {
    const token = genToken();
    insertTop( `\n#define ${ token }(a,b,x) ${ glslSaturate( '(((x)-(a))/((b)-(a)))' ) }\n` );
    return ( a: string, b: string, x: string ) => `(${ token }(${ a },${ b },${ x }))`;
  } );

  return linearstep( a, b, x );
}
