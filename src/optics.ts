import { Maybe } from "./monads.ts"

module dcAG.functionalTS.optics {

    // LENS - for getting and updating in immutable data-structures
    // (reifies the "has-a"-concept)

    interface Lens<I, P, PR, O> {
        get(i: I): P
        set(i: I, pr: PR): O
        compose<P2, P2R>(l2: Lens<P, P2, P2R, PR>): Lens<I, P2, P2R, O>
    }

    // INNERLENS - for getting and updating within immutable data-structures (product-types) without changing the schema
        
    interface InnerLens<I, P> extends Lens<I, P, P, I> {}
    
    function lens<I, P, PR, O>(p: (i:I) => P, u: (i:I, pr: PR) => O): Lens<I, P, PR, O> {
        return {
            get(i:I): P { return p(i) },
            set(i:I, pr: PR): O { return u(i, pr) },
            compose<P2, P2R>(l2: Lens<P, P2, P2R, PR>): Lens<I, P2, P2R, O> {
                return lens((i:I): P2 => l2.get(p(i)), (i:I, p2r: P2R): O => u(i, l2.set(p(i), p2r)))
            }
        }
    }
    
    function innerLens<I, P>(p: (i:I) => P, u: (i:I, p: P) => I): InnerLens<I, P> { return lens(p, u) }


   // PRISM - for getting and updating within sum-types
   // (reifies the "is-a"-concept)

    interface Prism<S, P> {
        getMaybe(s: S): Maybe<P>
        setIfPresent(s: S, p: P): S
        compose<P2>(p: Prism<P, P2>): Prism<S, P2>
    }

    function prism<S, P>(g: (s:S) => Maybe<P>, c: (s: S, p: P) => S): Prism<S, P> { 
        return {
            getMaybe(s: S): Maybe<P> { return g(s) },
            setIfPresent(s: S, p:P): S { return c(s, p) },
            compose<P2>(other: Prism<P, P2>): Prism<S, P2> { 
                return prism(
                    (s: S) => g(s).flatMap(x => other.getMaybe(x)), 
                    (s: S, p2: P2) => {
                        const maybeP = g(s)
                        return maybeP instanceof Just<P> ? c(s, maybeP.getOrError()): s
                    }
                )
            }
        }
    }
}