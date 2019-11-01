import express from 'express';
import User from '../models/User.model';
import Pet from '../models/Pet.model';
import checkAuth from '../middleware/checkAuth';
const router = express.Router();

router.get('/pets', async (req, res) => {
  try {
    const pets = await Pet.find({}, '_id name image createdAt breed');
    return res.status(200).json({ pets });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.get('/pets/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    const pet = await Pet.findById({ _id: petId }).populate(
      'postedBy',
      'contactInfo.email contactInfo.phone username'
    );
    return res.status(200).json({ pet });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.get('/mypet', checkAuth, async (req, res) => {
  try {
    /*const data = await User.findById(
      { _id: req.data.id },
      { username: 0, password: 0, createdAt: 0, updatedAt: 0, _id: 0 }
    ).populate('pet');*/
    const data = await Pet.findOne({ postedBy: req.data.id }).populate(
      'postedBy',
      'contactInfo.email contactInfo.phone username'
    );
    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.post('/pet', checkAuth, async (req, res) => {
  try {
    const { name, breed, image, date, lat, long, info, found } = req.body;
    const user = await User.findById({ _id: req.data.id });
    if (user.pet) {
      return res.status(400).json({
        message:
          'It seems you already have an active missing pet ad, if you want to update the ad please do so in the settings.'
      });
    }
    const pet = await Pet.create({
      name,
      breed,
      image,
      lastSeen: {
        date,
        location: {
          lat,
          long
        }
      },
      additionalInfo: info,
      found,
      postedBy: user.id
    });
    await User.findByIdAndUpdate({ _id: req.data.id }, { pet: pet.id });
    return res.status(201).json({ pet });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.put('/pet', checkAuth, async (req, res) => {
  try {
    const { found, image, info, email, phone } = req.body;
    await Pet.findOneAndUpdate(
      { postedBy: req.data.id },
      { found, image, info },
      { new: true }
    );

    await User.findByIdAndUpdate(
      { _id: req.data.id },
      {
        contactInfo: {
          email,
          phone
        }
      },
      { new: true }
    );
    return res.status(200).json({
      message: 'Ad successfully updated.'
    });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.delete('/pet', checkAuth, async (req, res) => {
  try {
    await Pet.findOneAndDelete({ postedBy: req.data.id });
    await User.findOneAndUpdate({ _id: req.data.id }, { $unset: { pet: '' } });
    return res.status(200).json({
      message: 'Ad deleted.'
    });
  } catch (e) {
    return res.status(500).json(e);
  }
});

export default router;