class Profile {
    constructor(profile){
        this.profileName = profile.profileName;
        this.firstName = profile.firstName;
        this.lastName = profile.lastName;
        this.email = profile.email;
        this.phone = profile.phone;
        this.cardHolder = profile.billing.cardHolder;
        this.cardNumber = profile.billing.cardNumber;
        this.cardMonth = profile.billing.cardMonth;
        this.cardYear = profile.billing.cardYear;
        this.cardCVV = profile.billing.cardCVV;
        this.address1 = profile.shipping.address1;
        this.address2 = profile.shipping.address2;
        this.city = profile.shipping.city;
        this.state = profile.shipping.state;
        this.country = profile.shipping.country;
        this.zipcode = profile.shipping.zipcode;
    };
    getProfileName(){
        return this.profileName;
    };
    getFirstName(){
        return this.firstName;
    };
    getLastName(){
        return this.lastName;
    };
    getEmail(){
        return this.email;
    };
    getPhone(){
        return this.phone;
    };
    getCardHolder(){
        return this.cardHolder;
    };
    getCardNumber(){
        return this.cardNumber;
    };
    getCardMonth(){
        return this.cardMonth;
    };
    getCardYear(){
        return this.cardYear;
    };
    getCardCVV(){
        return this.cardCVV;
    };
    getAddress1(){
        return this.address1;
    };
    getAddress2(){
        return this.address2;
    };
    getCity(){
        return this.city;
    };
    getState(){
        return this.state;
    };
    getCountry(){
        return this.country;
    };
    getZipcode(){
        return this.zipcode;
    };
};

module.exports = Profile;