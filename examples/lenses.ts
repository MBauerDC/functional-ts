import { GenericLens, InnerLens, Lens } from "./../src/optics.ts";

type FirstName = string
type MiddleName = string
type LastName = string
type CompanyName = string
type Name = { readonly firstName: FirstName, readonly middleName: MiddleName|null, readonly lastName: LastName }
type City = string
type StreetLine = string
type ZipCode = string
type Country = string
type PostalAddress = { readonly streetLine1: StreetLine, readonly streetLine2: StreetLine|null, readonly zipCode: ZipCode, readonly city: City, readonly country: Country }
type Company = { readonly companyName: CompanyName, readonly postalAddress: PostalAddress }
type Person = { readonly name: Name, readonly postalAddress: PostalAddress }
type Employee = Person & { readonly company: CompanyName }

const company1: Company = {
    companyName: "dc Ag",
    postalAddress: {
        streetLine1: "Von-Linde-Straße 11",
        streetLine2: null,
        zipCode: "95326",
        city: "Kulmbach",
        country: "Germany"
    }
}

const employee1: Employee = {
 name: {
    firstName: "Michael",
    middleName: null,
    lastName: "Bauer"
 },
 postalAddress: {
    streetLine1: "Buchenweg 4",
    streetLine2: null,
    zipCode: "95445",
    city: "Bayreuth",
    country: "Germany"
 },
 company: "dc AG"
}

console.log("Original employee record: ");
console.log(employee1)


// Without lenses, the most efficient way of updating nested values, e.g. the zipCode in employee1
// is using the splat operator
const manuallyUpdatedEmployee1: Employee = 
  {
    ...employee1,
    postalAddress: {
        ...employee1.postalAddress,
        zipCode: "95444"
    }
  }
console.log("Manually updated employee record: ");
console.log(manuallyUpdatedEmployee1)

// If we want a function that updates a PostalAddress in an employee, we have to create it like thus:
const empPostalAddressManualUpdater: (e: Employee, p: PostalAddress) => Employee = 
    (e, p) => {
        const newEmployee: Employee = {
            ...e,
            postalAddress: p
        }
        return newEmployee
    }

// If we want a function to update a zipCode in a postalAddress, we have to create it like thus:
const postalAddressZipCodeManualUpdater: (p: PostalAddress, z: ZipCode) => PostalAddress = 
  (p, z) => {
    const newPostalAddress: PostalAddress = {
        ...p,
        zipCode: z
    }
    return newPostalAddress
  }

// If we want to combine these, we have to either manually define a new function like thus
const combinedUpdater: (e: Employee, z: ZipCode) => Employee = 
  (e, z) => {
    return empPostalAddressManualUpdater(
        e,
        postalAddressZipCodeManualUpdater(e.postalAddress, z)
    )
  }
// or compose them at the call-site
const combinedManuallyUpdatedEmployee1: Employee = 
  empPostalAddressManualUpdater(
    employee1,
    postalAddressZipCodeManualUpdater(employee1.postalAddress, "95444")
  )


// With lenses, we can abstract getters/setters and combine them on the fly in a type-safe way(!)
// InnerLens<InputType, ProjectedType> is basically a getter and an updater for a field of type ProjectedType in an object of type InputType
// Instead of manually providing the getter and updater-method, we can use 
// the static 'property' method on GenericLens to specify that we want an InnerLens for a given InputType, ProjectedType and field-name

const empAddrLens = GenericInnerLens.property<Employee,  PostalAddress>('postalAddress');

// Compiler will know the correct type of the returned value
const empAddr = empAddrLens.get(employee1)


// --!!-- Compiler catches when property-name does not exist. The following will yield a compiler error: --!!--
//const invalidEmpLens = GenericLens.property<Employee, PostalAddress>("postalAddress2")

//// --!!-- Compiler also catches when stated generic projection-field-name does not exist in the source-type. The following will yield a compiler error: --!!--
////const invalidEmpLens2 = GenericLens.property<Employee, PostalAddress>("postalAddress")

// --!!-- Compiler also catches when given projection-type does not exist in the source type. The following will yield a compiler error: --!!--
//const invalidEmpLens3 = GenericLens.property<Employee, number>("name")



const addrStreetLine1Lens = GenericInnerLens.property<PostalAddress, StreetLine>('streetLine1');
const addrZipCodeLens = GenericInnerLens.property<PostalAddress, ZipCode>('zipCode');

// We can compose lenses in a type-safe way:
const employeeStreetLine1Lens = empAddrLens.compose(addrStreetLine1Lens) as InnerLens<Employee, StreetLine>;
const employeeZipCodeLens = empAddrLens.compose(addrZipCodeLens) as InnerLens<Employee, ZipCode>;

console.log("Employee1's streetLine1 value via lens: ")
console.log(employeeStreetLine1Lens.get(employee1));
console.log("Employee1's zip-code value via lens: ")
console.log(employeeZipCodeLens.get(employee1));


// If we want to get and update a pair of fields (or nested pairs), we can zip Lenses in a type-safe way
const zippedLens = employeeStreetLine1Lens.zipWith(employeeZipCodeLens)

// --!!-- Compiler catches when lenses cannot be correctly composed. The following will yield a compiler error: --!!--
//const invalidCompisition = empAddrLens.compose(employeeStreetLine1Lens);

// --!!-- Compiler catches when lenses cannot be correctly zipped. The following will yield a compiler error: --!!--
//const invalidCompisition = employeeStreetLine1Lens.zipWith(addrStreetLine1Lens)


// We can get updated employees easily and in a type-safe manner via the set method of the lens
const employee1newStreetLine1 = employeeStreetLine1Lens.set(employee1, "Jean-Paul-Straße 26")
const employee1newZipCode = employeeZipCodeLens.set(employee1newStreetLine1, "95444")

// Or use the zipped lens(!)
const emplyee1newStreetLine1ZipCode = zippedLens.set(employee1, ["Jean-Paul-Straße 26", "95444"])
console.log("Employee1 updated with a zipped lens: ")
console.log(emplyee1newStreetLine1ZipCode)


// --!!-- Compiler also catches when updates are given the wrong type. The following will yield a compiler error: --!!--
//const employee1InvalidNewZipCode = employeeZipCodeLens.set(employee1newStreetLine1, 3)

console.log("Updated streetLine1 by the same lens as above: ")
console.log(employeeStreetLine1Lens.get(employee1newZipCode))
console.log("Updated zipCode by the same lens as above: ")
console.log(employeeZipCodeLens.get(employee1newZipCode))
console.log("Entire updated employee: ")
console.log(employee1newZipCode)

    