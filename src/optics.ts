import { Maybe } from "./monads.ts"

module dcAG.functionalTS.optics {

    // LENS - for getting and updating in immutable data-structures
    // (reifies the "has-a"-concept)

    interface Lens<I, P, PR, O> {
        get(i: I): P
        set(i: I, pr: PR): O
        compose<P2, P2R>(l2: Lens<P, P2, P2R, PR>): Lens<I, P2, P2R, O>
    }

    // INNERLENS - for getting and upting within immutable data-structures without changing the schema
    
    interface InnerLens<I, P> {
        get(i: I): P
        set(i: I, pr: P): I
        compose<P2>(l2: InnerLens<P, P2>): InnerLens<I, P2>
        zipWith<P2>(l2: InnerLens<I, P2>): InnerLens<I, [P, P2]>
    }

    class GenericLens<I, P, PR, O> implements Lens<I, P , PR, O> {
        constructor(protected p: (i:I) => P, protected u: (i:I, pr: PR) => O){}
        get(i:I): P { return this.p(i) }
        set(i:I, pr: PR): O { return this.u(i, pr) }
        compose<P2, P2R>(l2: Lens<P, P2, P2R, PR>): Lens<I, P2, P2R, O> {
          return lens(
            (i:I): P2 => 
              l2.get(
                  this.p(i)
              ), 
            (i:I, p2r: P2R): O => 
              this.u(
                i, 
                l2.set(
                  this.p(i), 
                  p2r
                )
              )
          )
        }
    }

    class GenericInnerLens<I, P> implements InnerLens<I, P> {

        constructor(protected p: (i:I) => P, protected u: (i:I, p:P) => I){}

        get(i:I): P { return this.p(i) }

        set(i:I, pr: P): I { return this.u(i, pr) }
        
        compose<P2>(l2: InnerLens<P, P2>): InnerLens<I, P2> {
          return innerLens(
            (i:I): P2 => 
              l2.get(
                  this.p(i)
              ), 
            (i:I, p2r: P2): I => 
              this.u(
                i, 
                l2.set(
                  this.p(i), 
                  p2r
                )
              )
          )
        }
        
        zipWith<P2>(l2: InnerLens<I, P2>): InnerLens<I, [P, P2]> {
            return innerLens(
                (i: I): [P, P2] =>
                  [this.p(i), l2.get(i)],
                (i: I, p: [P, P2]) =>  {
                    const iWithPR = this.set(i, p[0])
                    const iWithP2R = l2.set(iWithPR, p[1])
                    return iWithP2R
                }
            )
        }
   
        static property<I2 extends Object, P2 extends I2[keyof I2]>(name: keyof I2): InnerLens<I2, P2> {
            const projector = (i: I2): P2 => i[name] as P2
            const updater =  (i: I2, newVal: P2) => {
                if (!(typeof i[name] === typeof newVal)) {
                    return i
                }
                const iCopy = Object.create(i)
                Object.assign(iCopy, i)
                const newProp = {}
                //@ts-ignore
                newProp[name] = newVal
                Object.assign(iCopy, newProp)
                return iCopy
            }
            return innerLens(projector, updater)
        }
    }
    
    function lens<I, P, PR, O>(p: (i:I) => P, u: (i:I, pr: PR) => O): Lens<I, P, PR, O> {
        return new GenericLens(p, u)
    }
    
    function innerLens<I, P>(p: (i:I) => P, u: (i:I, p: P) => I): InnerLens<I, P> { return new GenericInnerLens(p, u) }


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