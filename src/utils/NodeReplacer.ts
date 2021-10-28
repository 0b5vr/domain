import { SceneNode } from '../heck/components/SceneNode';

export class NodeReplacer<T extends SceneNode> {
  public current: T;
  public creator: () => T;

  public constructor( current: T, creator: () => T ) {
    this.current = current;
    this.creator = creator;
  }

  public replace( parent: SceneNode ): void {
    const currentIndex = parent.children.indexOf( this.current );
    this.current = this.creator();
    parent.children.splice( currentIndex, 1, this.current );
  }
}
