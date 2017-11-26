// Главная страница
import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { PARAM_VALUES } from '../../constants/reused_strings'

class NotFound extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className='markup__column-start-center'>
        <div className='markup__content-wrapper markup__wrap-padding markup__padding-20-bottom'>
          <div className='markup__row-start-start page_not_found markup__padding-20-bottom'>
            <div className='markup__column-start-stretch font-pt-bold page_not_found__404'>
              404
            </div>
            <div className='markup__column-start-stretch'>
              <div className='markup__column-start-stretch markup__padding-20-bottom markup__margin-10-bottom'>
                <h1 className='font-pt-regular font-size-30'>
                  Ошибка, страница не найдена
                </h1>

                <div className='font-pt-regular font-size-16'>
                  Возможно Вы неправильно набрали адрес страницы или же данной страницы более не существует
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default NotFound
