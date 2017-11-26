import PropTypes from 'prop-types'

module.exports = {
  pointer_shape: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }))
}
