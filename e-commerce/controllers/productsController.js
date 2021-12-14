const multer = require('multer');
const uuid = require('uuid');
const jimp = require('jimp');
const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const Cart = mongoose.model('Cart');
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true); //1st value is provided in case of error.
        } else {
            next({
                message: 'That filetype isn\'t allowed'
            }, false);
        }
    }
};

//exports -> global variable -> everything within can be imported
exports.homePage = (req, res) => {

    res.render('extendingLayout', {
        title: 'E-Commerce'
    }); //finalmente, hacemos el RESPONSE.
};

exports.addProduct = (req, res) => {
    //same template is used to create and to edit
    res.render('editProduct', {
        title: 'Add Product'
    });
};



exports.createProduct = async (req, res) => {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    console.log('Product saved!');
    req.flash('success', `Successfully Created ${product.name}.`);
    res.redirect(`/product/${savedProduct.slug}`);
};

exports.createCart = async (req, res) => {
    const cart = new Cart({
        idProduct: req.body.id,
        user: req.body.user
    });
    const savedCart = await cart.save();
    console.log('Cart saved!');
    req.flash('success', `Successfully added to cart ${cart.idProduct}.`);
    res.redirect(`/products/`);
};

exports.deleteCart = async (req, res) => {
    const cart = await Cart.findOne({
        idProduct: req.body.id,
        user:req.body.user
    })
    if(cart){
        cart.remove();
        req.flash('success', `Successfully deleted to cart`)
    }else{
        req.flash('error', `Error: Cannot delete the product`)
    }
    
    res.redirect(`/cart`);
};

exports.getProductBySlug = async (req, res, next) => {
    const product = await Product.findOne({
        slug: req.params.slug
    });
    // If no product -> DB send a NULL -> do nothing and follow the pipeline
    if (!product) {
        next();
        return;
    }
    res.render('product', {
        title: `Product ${product.name}`,
        product: product
    });
};

//MIDLEWARE FUNCTION for CREATE PRODUCTS
exports.verify = multer(multerOptions).single('photo');

//MIDLEWARE FUNCTION for CREATE PrODUCT
exports.upload = async (req, res, next) => {
    //check if there is no new file to resize
    if (!req.file) {
        next(); // no file -> do nothing and go to next middleware
        return;
    }
    console.log(req.body);
    console.log(req.file);

    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    //now we resize and write in hard-drive
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO); //width=800, height=AUTO
    await photo.write(`./public/uploads/${req.body.photo}`);

    //photo saved in file system, keep going with the PIPELINE
    next();
};



exports.getProducts = async (req, res) => {
    const products = await Product.find();
    res.render('products', {
        title: 'Products',
        products: products
    });
};


exports.searchProducts = async (req, res) => {
    const products = await Product.find({
        $text: { //1er param: query filter
            $search: req.query.q
        }
    }, { //2n param: query projection
        score: {
            $meta: 'textScore'
        }
    }).sort({ //first filter
        score: {
            $meta: 'textScore'
        }
    }).limit(5); //second filter
    res.json({
        products,
        length: products.length
    });
};

exports.cart = async(req, res) =>{
    const carts = await Cart.find();
    const products = await Product.find();
    res.render('cart', {
        title:'Shopping Cart',
        carts: carts,
        products : products
    });

}