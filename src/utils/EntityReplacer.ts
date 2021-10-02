import { Entity } from '../heck/Entity';

export class EntityReplacer<T extends Entity> {
  public current: T;
  public creator: () => T;

  public constructor( current: T, creator: () => T ) {
    this.current = current;
    this.creator = creator;
  }

  public replace( parent: Entity ): void {
    const currentIndex = parent.children.indexOf( this.current );
    this.current = this.creator();
    parent.children.splice( currentIndex, 1, this.current );
  }
}
