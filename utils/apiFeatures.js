class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    // exclude sort , limit , page and fields from query obj;
    const excludedFields = ['sort', 'page', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // advance filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      // if we want to mention more fields for sorting we need to add space field name
      // { sort: 'price,ratingAverage' } actual query objec
      // required object will be in the form  { sort: 'price ratingAverage' }
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const limitBy = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(limitBy);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page || 1;
    const limit = this.queryString.limit || 100;
    const skipDocuments = (page - 1) * limit * 1;

    // if (req.query.page) {
    //   const numDocuments = await Tour.countDocuments();
    //   if (skipDocuments >= numDocuments)
    //     throw new Error("This page doesn't exist");
    // }
    this.query = this.query.skip(skipDocuments).limit(limit * 1);
    return this;
  }
}

module.exports = APIFeatures;
