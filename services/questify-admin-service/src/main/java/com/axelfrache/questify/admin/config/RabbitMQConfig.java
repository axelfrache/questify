package com.axelfrache.questify.admin.config;

import com.axelfrache.questify.admin.messaging.QueueConstants;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

  @Bean
  public TopicExchange questifyExchange() {
    return new TopicExchange(QueueConstants.EXCHANGE, true, false);
  }

  @Bean
  public Queue userRegisteredQueue() {
    return QueueBuilder.durable(QueueConstants.USER_REGISTERED_QUEUE).build();
  }

  @Bean
  public Queue userDeletedQueue() {
    return QueueBuilder.durable(QueueConstants.USER_DELETED_QUEUE).build();
  }

  @Bean
  public Binding userRegisteredBinding() {
    return BindingBuilder.bind(userRegisteredQueue())
        .to(questifyExchange())
        .with(QueueConstants.USER_REGISTERED_ROUTING_KEY);
  }

  @Bean
  public Binding userDeletedBinding() {
    return BindingBuilder.bind(userDeletedQueue())
        .to(questifyExchange())
        .with(QueueConstants.USER_DELETED_ROUTING_KEY);
  }

  @Bean
  public MessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  @Bean
  public RabbitTemplate rabbitTemplate(
      ConnectionFactory connectionFactory, MessageConverter messageConverter) {
    var template = new RabbitTemplate(connectionFactory);
    template.setMessageConverter(messageConverter);
    return template;
  }
}
