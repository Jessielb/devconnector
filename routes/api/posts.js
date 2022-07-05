const { compareSync } = require('bcryptjs');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
    '/', 
    [ 
        auth, 
        [
            check('text', 'Text is required')
                .not()
                .isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post ({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });  
            
            const post = await newPost.save();

            res.json(post);
        } 
        catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } 
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) { // check if post with that ID exists
            return res.status(404).json({ msg: 'Post not found'});
        }

        res.json(post);
    } 
    catch (err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') { // if not a  valid post id
            return res.status(404).json({ msg: 'Post not found.'});
        }

        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) { // check if post with that ID exists
            return res.status(404).json({ msg: 'Post not found'});
        }

        // make sure user deleting post is the one that made that post
        if(post.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'User not authorized' });
        }
        await post.remove();

        res.json({ msg: 'Post removed '});
    } 
    catch (err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') { // if not a  valid post id
            return res.status(404).json({ msg: 'Post not found.'});
        }

        res.status(500).send('Server Error');
    }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); // find by ID of the post

        // check if post has already been liked by the user

        /* 'filter' js method creates an array (from an existing array) with all elements that pass 
            a test (of a provided function). In this case, we're filtering the 'likes' array in Posts by comparing a user ID to the current logged in user "req.user.id", after that we get the length of this filtered array, and if it's greater than 0 then we know that logged user has already liked that post, and therefore should return an error  */
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        // if the user hasn't already liked it, unshift adds this user to the beginning of the array
        post.likes.unshift({ user: req.user.id});

        await post.save();

        res.json(post.likes);
    }
    catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unike a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); // find by ID of the post

        // check if post has already been liked by the user

        /* This time, if length is 0 then we know that the logged user has not already liked that post, and therefore should return an error  */
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        // Get the index in array of like to remove
        const removeIndex = post.likes
            .map(like => like.user.toString())
            .indexOf(req.user.id);

        post.likes.splice(removeIndex, 1); // remove it from array

        await post.save();

        res.json(post.likes); // returns the likes array (should be empty [] if no posts liked)
    }
    catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
    '/comment/:id', 
    [ 
        auth, 
        [
            check('text', 'Text is required')
                .not()
                .isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const post = await Post.findById(req.params.id); // cause we get the id from the url, hence params

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };  
            
            post.comments.unshift(newComment);

            await post.save();

            res.json(post.comments);
        } 
        catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        // note: in order to delete a comment, we need the post id (that the comment belongs to), and the id of the comment itself
        const post = await Post.findById(req.params.id); // find post by ID

        // get the comment from post 'comments' array using find(), by checking for the comment id equal to the passed id in the url (params)
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        // gives us the comment if it exists within the array, or false

        // Make sure comment exists
        if (!comment){
            return res.status(404).json({ msg: 'Comment does not exist' }); // 404 for not found
        }

        // Make sure user deleting comment is the one who made comment
        // req.user.id is the logged in user, and comment.user is the user object id within Post comments
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' }); // 401 for unauthorized
        }

        // Get the index in array of comment to remove
        const removeIndex = post.comments
            .map(comment => comment.user.toString())
            .indexOf(req.user.id);

        post.comments.splice(removeIndex, 1); // remove it from array

        await post.save();

        res.json(post.comments); // returns the comments array
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; // export the route