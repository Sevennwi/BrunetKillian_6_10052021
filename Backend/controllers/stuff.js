const Thing = require('../models/Thing');
const fs = require('fs');


exports.createThing = (req, res, next) => {
  const sauceData = JSON.parse(req.body.sauce)
  console.log(sauceData)
  const thing = new Thing({
    ...sauceData,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  thing.save().then(
    () => {
      res.status(201).json({
        message: 'Sauce enregistrée !'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getOneThing = (req, res, next) => {
  Thing.findOne({
    _id: req.params.id
  }).then(
    (thing) => {
      res.status(200).json(thing);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifyThing = (req, res, next) => {
  const sauceData = req.file
  ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    }

  : { ...req.body };
  
  Thing.updateOne({ _id: req.params.id}, {...sauceData, _id: req.params.id })
  .then(
    () => {
      res.status(201).json({
        message: 'Sauce modifiée !'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.deleteThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id })
    .then(thing => {
      const filename = thing.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Thing.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAllThings = (req, res, next) => {
  Thing.find().then(
    (things) => {
      res.status(200).json(things);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.likeSauce = (req, res, next) => {

  switch (req.body.like) {
    case 0:                                                   
      Thing.findOne({ _id: req.params.id })
        .then((sauce) => {
          if (sauce.usersLiked.find( user => user === req.body.userId)) {  
            Thing.updateOne({ _id: req.params.id }, {         
              $inc: { likes: -1 },                           
              $pull: { usersLiked: req.body.userId }          
            })
              .then(() => { res.status(201).json({ message: "vote enregistré."}); })
              .catch((error) => { res.status(400).json({error}); });

          } 
          if (sauce.usersDisliked.find(user => user === req.body.userId)) { 
            Thing.updateOne({ _id: req.params.id }, {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId }
            })
              .then(() => { res.status(201).json({ message: "vote enregistré." }); })
              .catch((error) => { res.status(400).json({error}); });
          }
        })
        .catch((error) => { res.status(404).json({error}); });
      break;
    
    case 1:                                                 
      Thing.updateOne({ _id: req.params.id }, {             
        $inc: { likes: 1 },                                 
        $push: { usersLiked: req.body.userId }              
      })
        .then(() => { res.status(201).json({ message: "Vous aimez la sauce" }); }) 
        .catch((error) => { res.status(400).json({ error }); });
      break;
    
    case -1:                                                  
      Thing.updateOne({ _id: req.params.id }, {               
        $inc: { dislikes: 1 },                               
        $push: { usersDisliked: req.body.userId }             
      })
        .then(() => { res.status(201).json({ message: "Vous n'aimez pas la sauce" }); }) 
        .catch((error) => { res.status(400).json({ error }); }); 
      break;
    default:
      console.error("bad request");
  }
};