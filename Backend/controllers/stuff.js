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
    case 0:                                                   //cas: req.body.like = 0
      Thing.findOne({ _id: req.params.id })
        .then((sauce) => {
          if (sauce.usersLiked.find( user => user === req.body.userId)) {  // on cherche si l'utilisateur est déjà dans le tableau usersLiked
            Thing.updateOne({ _id: req.params.id }, {         // si oui, on va mettre à jour la sauce avec le _id présent dans la requête
              $inc: { likes: -1 },                            // on décrémente la valeur des likes de 1 (soit -1)
              $pull: { usersLiked: req.body.userId }          // on retire l'utilisateur du tableau.
            })
              .then(() => { res.status(201).json({ message: "vote enregistré."}); }) //code 201: created
              .catch((error) => { res.status(400).json({error}); });

          } 
          if (sauce.usersDisliked.find(user => user === req.body.userId)) {  //mêmes principes que précédemment avec le tableau usersDisliked
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
    
    case 1:                                                 //cas: req.body.like = 1
      Thing.updateOne({ _id: req.params.id }, {             // on recherche la sauce avec le _id présent dans la requête
        $inc: { likes: 1 },                                 // incrémentaton de la valeur de likes par 1.
        $push: { usersLiked: req.body.userId }              // on ajoute l'utilisateur dans le array usersLiked.
      })
        .then(() => { res.status(201).json({ message: "Vous aimez la sauce" }); }) 
        .catch((error) => { res.status(400).json({ error }); });
      break;
    
    case -1:                                                  //cas: req.body.like = 1
      Thing.updateOne({ _id: req.params.id }, {               // on recherche la sauce avec le _id présent dans la requête
        $inc: { dislikes: 1 },                                // on décremente de 1 la valeur de dislikes.
        $push: { usersDisliked: req.body.userId }             // on rajoute l'utilisateur à l'array usersDisliked.
      })
        .then(() => { res.status(201).json({ message: "Vous n'aimez pas la sauce" }); }) 
        .catch((error) => { res.status(400).json({ error }); }); 
      break;
    default:
      console.error("bad request");
  }
};