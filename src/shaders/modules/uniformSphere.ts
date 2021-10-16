import { GLSLExpression, acos, cache, cos, def, defFn, mul, retFn, sin, sub, vec3 } from '../../shader-builder/shaderBuilder';
import { PI } from '../../utils/constants';
import { glslDefRandom } from './glslDefRandom';

export function uniformSphere(): GLSLExpression<'vec3'> {
  const { random } = glslDefRandom();

  const f = cache(
    'uniformSphere',
    () => defFn( 'vec3', [], () => {
      const phi = def( 'float', mul( random(), 2.0 * PI ) );
      const theta = def( 'float', acos( sub( mul( 2.0, random() ), 1.0 ) ) );
      const sinTheta = def( 'float', sin( theta ) );
      retFn( vec3( mul( sinTheta, cos( phi ) ), mul( sinTheta, sin( phi ) ), cos( theta ) ) );
    } )
  );

  return f();
}
