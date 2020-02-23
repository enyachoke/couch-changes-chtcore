const medic_config = require(__dirname + '/./config/medic.json')
const ChangesReader = require('changesreader')
const cr = new ChangesReader(medic_config.medic_db, medic_config.couch_url)
const models = require('./models');
const fs = require('fs');
function emit(key, value) {
    return { key, value }
}
function mapDocs(doc) {
    if (doc.type === 'tombstone' && doc.tombstone) {
        doc = doc.tombstone;
      }
    
      if (doc._id === 'resources' ||
          doc._id === 'branding' ||
          doc._id === 'partners' ||
          doc._id === 'service-worker-meta' ||
          doc._id === 'zscore-charts' ||
          doc._id === 'settings' ||
          doc.type === 'form' ||
          doc.type === 'translations') {
        return emit('_all', {});
      }
    
      var getSubject = function() {
        if (doc.form) {
          // report
          if (doc.contact && doc.errors && doc.errors.length) {
            for (var i = 0; i < doc.errors.length; i++) {
              // invalid or no patient found, fall back to using contact. #3437
              if (doc.errors[i].code === 'registration_not_found' ||
                  doc.errors[i].code === 'invalid_patient_id') {
                return doc.contact._id;
              }
            }
          }
          return (doc.patient_id || (doc.fields && doc.fields.patient_id)) ||
                 (doc.place_id || (doc.fields && doc.fields.place_id)) ||
                 (doc.fields && doc.fields.patient_uuid) ||
                 (doc.contact && doc.contact._id);
        }
        if (doc.sms_message) {
          // incoming message
          return doc.contact && doc.contact._id;
        }
        if (doc.kujua_message) {
          // outgoing message
          return doc.tasks &&
                 doc.tasks[0] &&
                 doc.tasks[0].messages &&
                 doc.tasks[0].messages[0] &&
                 doc.tasks[0].messages[0].contact &&
                 doc.tasks[0].messages[0].contact._id;
        }
      };
      switch (doc.type) {
        case 'data_record':
          var subject = getSubject() || '_unassigned';
          var value = {};
          if (doc.form && doc.contact) {
            value.submitter = doc.contact._id;
            return emit(subject, value);
          }
          
          if (doc.fields &&
              doc.fields.needs_signoff &&
              doc.contact
          ) {
            var contact = doc.contact;
            while (contact) {
              if (contact._id && contact._id !== subject) {
                return emit(contact._id, value);
              }
              contact = contact.parent;
            }
          }
          return;
        case 'task':
          return emit(doc.user, {});
        case 'target':
          return emit(doc.owner, {});
        case 'contact':
        case 'clinic':
        case 'district_hospital':
        case 'health_center':
        case 'person':
          return emit(doc._id, {});
      }
}
function saveChanges(changes) {
    models.change.bulkCreate(changes, { returning: false }).then((result) => {
        //console.log(result);
    }).catch((err) => {
        console.error(err);
    });
}
function processChanges(changes) {
    let mappedChanges = [];
    for (let i = 0; i < changes.length; i++) {
        let mappedDoc = mapDocs(changes[i].doc);
        if (mappedDoc) {
            let mappedDocCopy = Object.assign({ id: changes[i].id, seq: changes[i].seq }, mappedDoc);
            let changeDoc = {};
            changeDoc._id = mappedDocCopy.id;
            changeDoc.change_key = mappedDocCopy.key;
            changeDoc.change_value = mappedDocCopy.value;
            changeDoc.seq_id = mappedDocCopy.seq;
            mappedChanges.push(changeDoc);
        }
    }
    saveChanges(mappedChanges);
}
let seq = 0;
let path = 'seq.txt';
try {
    if (fs.existsSync(path)) {
        seq = fs.readFileSync(path, 'utf8')
    }
} catch (err) {
    console.error(err)
    seq = 0;
}
console.log('Starting at========>',seq);
cr.start({ since: seq, includeDocs: true, batchSize: medic_config.batch_size })
    .on('batch', (b) => {
        console.log('a batch of', b.length, 'changes has arrived');
        processChanges(b);
    }).on('seq', (s) => {
        console.log('sequence token', s);
        const data = new Uint8Array(Buffer.from(s));
        try {
            fs.writeFile(path, data, (err) => {
                if (err) throw err;
                console.log('SEQ saved');
            });
        } catch (err) {
            console.error(err)

        }
    }).on('error', (e) => {
        console.error('error', e);
    });