import { GLSLExpression, def, min, sw } from '../../shader-builder/shaderBuilder';

export const minOfVec3 = ( v: GLSLExpression<'vec3'> ): GLSLExpression<'float'> => {
  const vt = def( 'vec3', v );
  return min( sw( vt, 'x' ), min( sw( vt, 'y' ), sw( vt, 'z' ) ) );
};
