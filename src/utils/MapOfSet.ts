export class MapOfSet<K, V> {
  private _map: Map<K, Set<V>>;

  public constructor() {
    this._map = new Map();
  }

  public get( key: K ): Set<V> {
    return this._map.get( key ) ?? new Set();
  }

  public add( key: K, value: V ): void {
    let set = this._map.get( key );
    if ( set == null ) {
      set = new Set();
      this._map.set( key, set );
    }
    set.add( value );
  }

  public clear(): void {
    this._map.clear();
  }
}
