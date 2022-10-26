module dcAG.functionalTS.algebraic {
    export interface Semigroup<T> {
        combine(l: T, r: T): T
    }
    
    export interface Monoid<T> extends Semigroup<T> {
        unit(): T
    }
    
    export interface Group<T> extends Monoid<T> {
        inverse(l: T, r: T): T
    }
}
