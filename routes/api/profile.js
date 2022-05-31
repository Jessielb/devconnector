const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => { // using async await
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']); // the first user is from Profile model user field, the populate user is from the table 'user', and the fields we want to bring in from there

        if(!profile){ // if there is no profile
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile); // otherwise if there is a profile, we send it along
    } 
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}); 

// @route   GET api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
    '/', 
    [ 
        auth, 
        [
            check('status', 'Status is required')
                .not()
                .isEmpty(),
            check('skills', 'Skills is required')
                .not()
                .isEmpty()
        ] 
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body; // we pull everything out from body

        // Build profile object
        const profileFields = {}; // profile fields object to insert to the db
        profileFields.user = req.user.id; // get the user's id
        if (company) profileFields.company = company; // check to see if the data for these fields is actually coming in
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim()); // make it so spaces after commas dont matter when listing skills
        }

        // Build social object
        profileFields.social = {}
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try { // whenever we use mongoose method like findOne, await in front
            let profile = await Profile.findOne( { user: req.user.id }); // look for profile for this user

            if (profile) { // if a profile is found, we update it
                // update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields }, 
                    { new: true }
                );

                return res.json(profile); // send back the profile
            }
            // if profile is not found, then we create it
            // Create
            profile = new Profile(profileFields); // create the profile

            await profile.save(); // save it
            res.json(profile);    // send back the profile      
        }
        catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router; // export the route