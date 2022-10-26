module dcAG.functionalTS.optics {

    // LENS - for getting and updating in immutable data-structures

    interface Lens<I, P, PR, O> {
        get(i: I): P
        set(i: I, pr: PR): O
        compose<P2, P2R>(l2: Lens<P, P2, P2R, PR>): Lens<I, P2, P2R, O>
    }

    // INNERLENS - for getting and upting within immutable data-structures without changing the schema
    
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
}