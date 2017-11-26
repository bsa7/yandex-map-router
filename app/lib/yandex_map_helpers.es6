/**
 * Сравнивает две точки координат
 * @param  {Object}
 * @param  {Object}
 * @return {[type]}
 */
const points_is_the_same = (point1 = {}, point2 = {}) => {
  return point1.latitude == point2.latitude && point1.longitude == point2.longitude
}

/**
 * Получает индекс искомой точки координат
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
const find_point_index = ({ points, point }) => {
  return points.findIndex((checked_point) => {
    return points_is_the_same(checked_point, point)
  })
}

/**
 * Перемещает элемент массива с одного места на другое
 * @param  {[type]}
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
const move_array_element = ({ items, old_index, new_index }) => {
  if (new_index >= items.length) {
    let k = new_index - this.length
    while ((k--) + 1) {
      items.push(undefined)
    }
  }
  items.splice(new_index, 0, items.splice(old_index, 1)[0])
  return items
};

module.exports = {
  find_point_index,
  move_array_element,
  points_is_the_same,
}
